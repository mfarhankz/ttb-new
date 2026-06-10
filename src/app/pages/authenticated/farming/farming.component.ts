import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonComponent } from '@app/shared/components';
import { AddressAutocompleteComponent } from '@app/shared/components/address-autocomplete/address-autocomplete.component';
import { OlMapComponent } from '@app/shared/components/ol-map/ol-map.component';
import { OlMapService, type MapObjectRefs } from '@app/core/services/ol-map.service';
import { MAP_DEFAULTS } from '@app/core/config/map.config';
import { LayoutService } from '@app/core/services/layout.service';
import { AreaSearchStateService } from '@app/core/services/area-search-state.service';
import { PropertySearchService } from '@app/core/services/property-search.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { SmartyAddressDetails } from '@app/core/interfaces/smarty.interface';
import { CountyFipsOption, ParcelSearchPayload } from '@app/core/interfaces/property-search.interface';

export type FarmingMapMode = 'radius' | 'boundary';

@Component({
  selector: 'app-farming',
  standalone: true,
  imports: [FormsModule, InputText, Select, ButtonComponent, OlMapComponent, AddressAutocompleteComponent],
  templateUrl: './farming.component.html',
  styles: []
})
export class FarmingComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly olMapService = inject(OlMapService);
  private readonly layoutService = inject(LayoutService);
  private readonly areaSearchStateService = inject(AreaSearchStateService);
  private readonly propertySearchService = inject(PropertySearchService);
  private readonly verticalService = inject(VerticalService);
  private sidebarResizeSub?: Subscription;
  private mapReadyAttempts = 0;
  private parcelCountyDebounce?: ReturnType<typeof setTimeout>;

  mapObject: MapObjectRefs = {};
  mapOptions = {
    lonLat: MAP_DEFAULTS.lonLat,
    zoom: MAP_DEFAULTS.zoom,
    calculateHeight: false,
    listenResize: true
  };

  readonly mapMode = signal<FarmingMapMode | null>(null);
  readonly showSearchPanel = signal(false);
  readonly showShapeActions = signal(false);
  readonly shapeSummary = signal('');
  readonly searchType = signal<'search' | 'parcel'>('search');
  readonly addressResetToken = signal(0);
  readonly parcelForm = signal<ParcelSearchPayload>({});
  readonly parcelCountyOptions = signal<CountyFipsOption[]>([]);
  readonly parcelSearching = signal(false);
  readonly searchError = signal<string | null>(null);

  readonly smartyVerificationEnabled = this.verticalService.smartyVerificationEnabled;

  ngOnInit(): void {
    this.sidebarResizeSub = this.layoutService.onSidebarResize.subscribe(() => {
      setTimeout(() => this.mapObject.map?.updateSize?.(), 220);
    });

    this.route.data.subscribe((data) => {
      const mode = data['mapMode'] as FarmingMapMode | undefined;
      if (mode) {
        this.mapMode.set(mode);
        this.scheduleMapMode(mode);
      }
    });
  }

  ngOnDestroy(): void {
    this.sidebarResizeSub?.unsubscribe();
    if (this.parcelCountyDebounce) {
      clearTimeout(this.parcelCountyDebounce);
    }
  }

  onParcelCountyFilter(event: { filter: string }): void {
    const query = event.filter?.trim() ?? '';
    if (this.parcelCountyDebounce) {
      clearTimeout(this.parcelCountyDebounce);
    }

    if (query.length < 3) {
      this.parcelCountyOptions.set([]);
      return;
    }

    this.parcelCountyDebounce = setTimeout(() => {
      this.propertySearchService.autocompleteCounties(query).subscribe({
        next: (options) => this.parcelCountyOptions.set(options),
        error: () => this.parcelCountyOptions.set([])
      });
    }, 400);
  }

  resetParcelForm(): void {
    this.searchError.set(null);
    this.parcelForm.set({});
    this.parcelCountyOptions.set([]);
  }

  onAddressPlaceChanged(details: SmartyAddressDetails): void {
    this.searchError.set(null);

    const lat = details.location?.lat;
    const lng = details.location?.lng;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.olMapService.centerMapOnCoordinates(this.mapObject, lng!, lat!);
      return;
    }

    const query = details.site_full_address?.trim();
    if (!query) {
      this.searchError.set('Address location is unavailable.');
      return;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    fetch(url, { headers: { Accept: 'application/json' } })
      .then((response) => response.json())
      .then((results: Array<{ lon?: string; lat?: string }>) => {
        const hit = results[0];
        if (!hit?.lon || !hit?.lat) {
          this.searchError.set('Address not found. Try a different search.');
          return;
        }

        this.olMapService.centerMapOnCoordinates(this.mapObject, Number(hit.lon), Number(hit.lat));
      })
      .catch(() => this.searchError.set('Failed to search address.'));
  }

  updateParcelNumber(value: string): void {
    this.parcelForm.update((current) => ({ ...current, parcel_number: value }));
  }

  updateParcelCounty(value: string): void {
    this.parcelForm.update((current) => ({ ...current, state_county_fips: value }));
  }

  searchParcelOnMap(): void {
    const form = this.parcelForm();
    if (!form.parcel_number?.trim()) {
      this.searchError.set('Parcel number is required.');
      return;
    }
    if (!form.state_county_fips) {
      this.searchError.set('County is required.');
      return;
    }

    this.searchError.set(null);
    this.parcelSearching.set(true);
    this.propertySearchService
      .searchParcel(form)
      .pipe(finalize(() => this.parcelSearching.set(false)))
      .subscribe({
        next: (result) => {
          const record = result.records[0];
          const lon = Number(record?.['sa_x_coord']);
          const lat = Number(record?.['sa_y_coord']);
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
            this.searchError.set('Parcel found but map location is unavailable.');
            return;
          }
          this.olMapService.centerMapOnCoordinates(this.mapObject, lon, lat, 16);
        },
        error: (err: Error) => this.searchError.set(err.message ?? 'Parcel search failed.')
      });
  }

  onGetCount(): void {
    this.openAreaSearch(true);
  }

  onAddFilters(): void {
    this.openAreaSearch(false);
  }

  onClearPin(): void {
    const mode = this.mapMode();
    if (!mode) {
      return;
    }

    this.shapeSummary.set('');
    this.showShapeActions.set(false);
    this.showSearchPanel.set(true);
    this.mapObject.geometry = undefined;
    this.mapObject.shapeAlertMessage = false;
    this.mapObject.topPolygonLength = '';
    this.mapObject.showSearchBox = true;
    this.olMapService.clearShapesLayer(this.mapObject);
    this.addressResetToken.update((token) => token + 1);
    this.activateMapMode(mode);
  }

  onClearSearch(): void {
    this.onCancelSearch();
  }

  onCancelSearch(): void {
    if (!this.mapObject.resetMapHandler) {
      return;
    }

    this.mapObject.resetMapHandler(this.mapObject, false);
    this.mapObject.geometry = undefined;
    this.mapObject.showSearchBox = false;
    this.mapObject.showRadiusBtn = false;
    this.mapObject.showDragBtn = false;
    this.mapObject.shapeAlertMessage = false;
    this.mapObject.topPolygonLength = '';
    this.showSearchPanel.set(false);
    this.showShapeActions.set(false);
    this.shapeSummary.set('');
    this.searchError.set(null);
    this.addressResetToken.update((token) => token + 1);
    this.olMapService.removeDrawInteraction(this.mapObject);
    void this.router.navigate(['/dashboard']);
  }

  private openAreaSearch(runGetCount: boolean): void {
    const geometry = this.mapObject.geometry;
    if (!geometry?.match || !geometry.value) {
      return;
    }

    this.areaSearchStateService.setPendingGeometry(
      {
        match: geometry.match,
        value: geometry.value
      },
      runGetCount
    );

    void this.router.navigate(['/farming/area-search']);
  }

  private scheduleMapMode(mode: FarmingMapMode): void {
    this.mapReadyAttempts = 0;
    const tryActivate = (): void => {
      if (this.mapObject.map && this.mapObject.shapesLayer) {
        this.activateMapMode(mode);
        return;
      }
      if (this.mapReadyAttempts++ < 50) {
        setTimeout(tryActivate, 100);
      }
    };
    tryActivate();
  }

  private activateMapMode(mode: FarmingMapMode): void {
    this.olMapService.clearMap(this.mapObject, false);
    this.showSearchPanel.set(true);
    this.showShapeActions.set(false);
    this.shapeSummary.set('');
    this.searchError.set(null);
    this.addressResetToken.update((token) => token + 1);
    this.mapObject.showSearchBox = true;
    this.mapObject.shapeAlertMessage = false;
    this.mapObject.showRadiusBtn = false;
    this.mapObject.showDragBtn = false;

    const shape = mode === 'radius' ? 'circle' : 'polygon';
    this.olMapService.createShapeFeature(this.mapObject, shape, {
      onDrawComplete: (_geometry, label) => {
        this.showSearchPanel.set(false);
        this.showShapeActions.set(true);
        this.shapeSummary.set(label);
      }
    });
  }
}
