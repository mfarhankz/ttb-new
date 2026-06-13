import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonComponent } from '@app/shared/components';
import { AddressAutocompleteComponent } from '@app/shared/widgets/address-autocomplete/address-autocomplete.component';
import { OlMapComponent } from '@app/shared/widgets/ol-map/ol-map.component';
import { OlMapService, type MapDrawnGeometry, type MapObjectRefs } from '@app/authenticated/map/services/ol-map.service';
import { MAP_DEFAULTS } from '@app/authenticated/map/config/map.config';
import { LayoutService } from '@app/core/services/layout.service';
import { AreaSearchStateService } from '@app/authenticated/farming/services/area-search-state.service';
import { StatsAreaSearchStateService } from '@app/authenticated/statistics/services/stats-area-search-state.service';
import { PropertySearchService } from '@app/authenticated/property-search/services/property-search.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { ClearSearchService } from '@app/authenticated/farming/services/clear-search.service';
import { ClearSearchStateService } from '@app/authenticated/farming/services/clear-search-state.service';
import { SEARCH_123_ROUTE } from '@app/authenticated/search-123/config/search-123.config';
import { Search123StateService } from '@app/authenticated/search-123/services/search-123-state.service';
import { SmartyAddressDetails } from '@app/core/interfaces/smarty.interface';
import { CountyFipsOption, ParcelSearchPayload } from '@app/core/interfaces/property-search.interface';

export type MapSearchMode = 'radius' | 'boundary';
export type MapSearchContext = 'farming' | 'statistics';

@Component({
  selector: 'app-map-search',
  standalone: true,
  imports: [FormsModule, InputText, Select, ButtonComponent, OlMapComponent, AddressAutocompleteComponent],
  templateUrl: './map-search.component.html',
  styles: []
})
export class MapSearchComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly olMapService = inject(OlMapService);
  private readonly layoutService = inject(LayoutService);
  private readonly areaSearchStateService = inject(AreaSearchStateService);
  private readonly statsAreaSearchStateService = inject(StatsAreaSearchStateService);
  private readonly propertySearchService = inject(PropertySearchService);
  private readonly verticalService = inject(VerticalService);
  private readonly clearSearchService = inject(ClearSearchService);
  private readonly clearSearchState = inject(ClearSearchStateService);
  private readonly search123StateService = inject(Search123StateService);
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

  readonly mapMode = signal<MapSearchMode | null>(null);
  readonly searchContext = signal<MapSearchContext>('farming');
  readonly showSearchPanel = signal(false);
  readonly showShapeActions = signal(false);
  readonly shapeSummary = signal('');
  readonly searchType = signal<'search' | 'parcel'>('search');
  readonly addressResetToken = signal(0);
  readonly parcelForm = signal<ParcelSearchPayload>({});
  readonly parcelCountyOptions = signal<CountyFipsOption[]>([]);
  readonly parcelSearching = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly returnUrl = signal<string | null>(null);

  readonly search123Handoff = computed(() => this.returnUrl() === SEARCH_123_ROUTE);

  readonly smartyVerificationEnabled = this.verticalService.smartyVerificationEnabled;

  constructor() {
    effect(() => {
      this.clearSearchState.setMapShapeActive(
        this.showShapeActions(),
        this.showShapeActions() ? this.searchContext() : null
      );
    });
  }

  ngOnInit(): void {
    this.returnUrl.set(this.route.snapshot.queryParamMap.get('returnUrl'));
    this.clearSearchService.registerMapHandler(() => this.onCancelSearch());
    this.sidebarResizeSub = this.layoutService.onSidebarResize.subscribe(() => {
      setTimeout(() => this.mapObject.map?.updateSize?.(), 220);
    });

    this.route.data.subscribe((data) => {
      const mode = data['mapMode'] as MapSearchMode | undefined;
      const context = (data['searchContext'] as MapSearchContext | undefined) ?? 'farming';
      this.searchContext.set(context);

      if (mode) {
        this.mapMode.set(mode);
        this.scheduleMapMode(mode);
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      this.returnUrl.set(params.get('returnUrl'));
    });
  }

  ngOnDestroy(): void {
    this.clearSearchService.unregisterMapHandler();
    this.clearSearchState.setMapShapeActive(false);
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
      this.olMapService.showSearchAddressMarker(this.mapObject, lng!, lat!, details);
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

        this.olMapService.showSearchAddressMarker(
          this.mapObject,
          Number(hit.lon),
          Number(hit.lat),
          details
        );
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
    if (this.search123Handoff()) {
      this.onContinueToSearch123();
      return;
    }

    this.openAreaSearch(true);
  }

  onAddFilters(): void {
    if (this.search123Handoff()) {
      this.onContinueToSearch123();
      return;
    }

    this.openAreaSearch(false);
  }

  onContinueToSearch123(geometryOverride?: MapDrawnGeometry): void {
    const geometry = geometryOverride ?? this.mapObject.geometry;
    const mode = this.mapMode();
    if (!geometry?.match || !geometry.value || !mode) {
      return;
    }

    const shape = mode === 'radius' ? 'circle' : 'polygon';
    this.search123StateService.setDrawnArea(geometry, shape);
    void this.router.navigateByUrl(SEARCH_123_ROUTE);
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
    this.olMapService.removeShapeEditInteractions(this.mapObject);
    this.olMapService.clearShapesLayer(this.mapObject);
    this.addressResetToken.update((token) => token + 1);
    this.activateMapMode(mode);
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
    const cancelRoute = this.resolveCancelRoute();
    void this.router.navigate([cancelRoute]);
  }

  private resolveCancelRoute(): string {
    if (this.returnUrl()) {
      return this.returnUrl()!;
    }

    return this.searchContext() === 'statistics' ? '/statistics/radius-search' : '/dashboard';
  }

  private openAreaSearch(runGetCount: boolean): void {
    const geometry = this.mapObject.geometry;
    if (!geometry?.match || !geometry.value) {
      return;
    }

    if (this.searchContext() === 'statistics') {
      const returnUrl =
        this.mapMode() === 'boundary'
          ? '/statistics/boundary-search'
          : '/statistics/radius-search';

      this.statsAreaSearchStateService.setPendingGeometry(
        {
          match: geometry.match,
          value: geometry.value
        },
        runGetCount,
        returnUrl
      );

      void this.router.navigate(['/statistics/area-search'], {
        queryParams: { returnUrl }
      });
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

  private scheduleMapMode(mode: MapSearchMode): void {
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

  private activateMapMode(mode: MapSearchMode): void {
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
    const shapeCallbacks = {
      onDrawComplete: (geometry: MapDrawnGeometry, label: string) => {
        this.shapeSummary.set(label);

        if (this.search123Handoff()) {
          setTimeout(() => this.onContinueToSearch123(geometry), 100);
          return;
        }

        this.showSearchPanel.set(false);
        this.showShapeActions.set(true);
      },
      onGeometryChange: (_geometry: unknown, label: string) => {
        this.shapeSummary.set(label);
      }
    };

    this.olMapService.createShapeFeature(this.mapObject, shape, shapeCallbacks);
  }
}
