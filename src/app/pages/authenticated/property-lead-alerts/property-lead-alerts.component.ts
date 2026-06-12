import { DecimalPipe } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { US_STATE_AREA_SEARCH_OPTIONS } from '@app/core/config/us-states.config';
import {
  PLA_COUNT_MAX_LIMIT,
  PLA_LEAD_TYPES_LABEL,
  PLA_PROPERTY_TYPES_LABEL,
  PLA_RADIUS_MILES,
  PLA_SUBSCRIPTION_PLAN,
  PLA_SUBSCRIPTION_PRICE,
  buildDefaultPlaSearchName,
  buildPlaQueryPayload,
  buildPlaSavePayload
} from '@app/core/config/property-lead-alerts.config';
import { MAP_DEFAULTS } from '@app/core/config/map.config';
import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
import { PlaSubscribedService } from '@app/core/interfaces/property-lead-alerts.interface';
import { SmartyAddressDetails } from '@app/core/interfaces/smarty.interface';
import { AreaSearchService } from '@app/core/services/area-search.service';
import { OlMapService, type MapObjectRefs } from '@app/core/services/ol-map.service';
import { PayNowModalService } from '@app/core/services/pay-now-modal.service';
import { PropertyLeadAlertsService } from '@app/core/services/property-lead-alerts.service';
import { SubscriptionService } from '@app/core/services/subscription.service';
import { AlertComponent, ButtonComponent, CardComponent } from '@app/shared/components';
import { AddressAutocompleteComponent } from '@app/shared/components/address-autocomplete/address-autocomplete.component';
import { AreaSearchControlStyles } from '@app/shared/components/area-search-fields/area-search-control.styles';
import { OlMapComponent } from '@app/shared/components/ol-map/ol-map.component';

@Component({
  selector: 'app-property-lead-alerts',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    InputText,
    CardComponent,
    AlertComponent,
    ButtonComponent,
    AddressAutocompleteComponent,
    OlMapComponent
  ],
  templateUrl: './property-lead-alerts.component.html'
})
export class PropertyLeadAlertsComponent implements OnInit, AfterViewInit {
  protected readonly controlStyles = AreaSearchControlStyles;
  protected readonly radiusMiles = PLA_RADIUS_MILES;
  protected readonly countMaxLimit = PLA_COUNT_MAX_LIMIT;
  protected readonly propertyTypesLabel = PLA_PROPERTY_TYPES_LABEL;
  protected readonly leadTypesLabel = PLA_LEAD_TYPES_LABEL;
  protected readonly subscriptionPrice = PLA_SUBSCRIPTION_PRICE;

  private readonly areaSearchService = inject(AreaSearchService);
  private readonly plaService = inject(PropertyLeadAlertsService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly payNowModalService = inject(PayNowModalService);
  private readonly olMapService = inject(OlMapService);
  readonly mapObject: MapObjectRefs = {};
  readonly mapOptions = {
    lonLat: MAP_DEFAULTS.lonLat,
    zoom: MAP_DEFAULTS.zoom,
    calculateHeight: false,
    listenResize: true
  };

  readonly addressResetToken = signal(0);
  readonly searchName = signal(buildDefaultPlaSearchName());
  readonly propertyCount = signal<number | null>(null);
  readonly countLoading = signal(false);
  readonly countError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly savedQueryDone = signal(false);
  readonly statusMessage = signal<string | null>(null);
  readonly statusType = signal<'success' | 'error' | 'info'>('info');
  readonly subscribedServices = signal<PlaSubscribedService[]>([]);
  readonly mapReady = signal(false);

  private queryPayload: AreaSearchPayload | null = null;
  private hydratedSubscription = false;
  private mapReadyAttempts = 0;

  readonly subscriptionActive = this.plaService.hasActivePlaSubscription;
  readonly loadingSubscription = computed(
    () => this.plaService.loadingSubscription() || this.subscriptionService.loading()
  );
  readonly subscriptionError = this.plaService.subscriptionError;

  readonly activeSubscription = computed(() => this.plaService.plaSubscription());
  readonly activeServiceName = computed(
    () => this.activeSubscription()?.subscribed_service?.service_name ?? ''
  );

  constructor() {
    effect(() => {
      if (this.subscriptionService.loading()) {
        return;
      }

      this.plaService.syncFromBillingHistory(this.subscriptionService.history());

      if (this.subscriptionActive() && !this.hydratedSubscription && this.mapReady()) {
        this.hydratedSubscription = true;
        this.hydrateActiveSubscription();
      }
    });
  }

  ngOnInit(): void {
    this.plaService.loadSubscription();
  }

  ngAfterViewInit(): void {
    this.scheduleMapReady();
  }

  private scheduleMapReady(): void {
    const tryReady = (): void => {
      if (this.mapObject.map && this.mapObject.shapesLayer) {
        this.mapReady.set(true);
        if (this.subscriptionActive() && !this.hydratedSubscription) {
          this.hydratedSubscription = true;
          this.hydrateActiveSubscription();
        }
        return;
      }

      this.mapReadyAttempts += 1;
      if (this.mapReadyAttempts < 40) {
        setTimeout(tryReady, 150);
      }
    };

    setTimeout(tryReady, 200);
  }

  onAddressSelected(details: SmartyAddressDetails): void {
    if (this.subscriptionActive()) {
      return;
    }

    const lat = details.location?.lat;
    const lng = details.location?.lng;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.applyAddressRadius(String(lat), String(lng), details);
      return;
    }

    const query = details.site_full_address?.trim();
    if (!query) {
      this.setStatus('error', 'Selected address does not include map coordinates.');
      return;
    }

    this.setStatus('info', '');

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    fetch(url, { headers: { Accept: 'application/json' } })
      .then((response) => response.json())
      .then((results: Array<{ lon?: string; lat?: string }>) => {
        const hit = results[0];
        if (!hit?.lon || !hit?.lat) {
          this.setStatus('error', 'Selected address does not include map coordinates.');
          return;
        }

        this.applyAddressRadius(hit.lat, hit.lon, {
          ...details,
          location: { lat: Number(hit.lat), lng: Number(hit.lon) }
        });
      })
      .catch(() => this.setStatus('error', 'Failed to geocode the selected address.'));
  }

  private applyAddressRadius(centerLat: string, centerLng: string, details: SmartyAddressDetails): void {
    const stateFips = this.resolveStateFips(details.site_state);
    if (!stateFips) {
      this.setStatus('error', 'Could not resolve state for the selected address.');
      return;
    }

    this.applyRadius(centerLat, centerLng, stateFips, details);
  }

  fetchPropertyCount(): void {
    if (!this.queryPayload) {
      return;
    }

    this.countLoading.set(true);
    this.countError.set(null);
    this.propertyCount.set(null);

    this.areaSearchService
      .getCount(this.queryPayload)
      .pipe(finalize(() => this.countLoading.set(false)))
      .subscribe({
        next: (data) => {
          const count = Number(data.rec_count ?? 0);
          this.propertyCount.set(Number.isFinite(count) ? count : null);
        },
        error: (err: Error) => {
          this.countError.set(err.message ?? 'Failed to get properties count.');
        }
      });
  }

  startAlerts(): void {
    if (this.subscriptionActive()) {
      return;
    }

    if (!this.searchName().trim()) {
      this.setStatus('error', 'Search name is required.');
      return;
    }

    if (!this.queryPayload?.geometry?.value) {
      this.setStatus('error', 'Please select a property or a radius first.');
      return;
    }

    if (this.savedQueryDone()) {
      this.openSubscriptionPayment();
      return;
    }

    const count = this.propertyCount();
    if (count == null) {
      this.setStatus('error', 'Property count is not available yet.');
      return;
    }

    this.submitting.set(true);
    this.setStatus('info', '');

    const payload = buildPlaSavePayload(this.searchName().trim(), count, this.queryPayload);

    this.plaService
      .saveQuery(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (message) => {
          this.savedQueryDone.set(true);
          this.setStatus('success', message);
          setTimeout(() => this.openSubscriptionPayment(), 1500);
        },
        error: (err: Error) => this.setStatus('error', err.message)
      });
  }

  retryServiceDetails(service: PlaSubscribedService): void {
    const queryId = service.id ?? service.query_id;
    if (service.source_type !== 'query' || queryId == null) {
      return;
    }

    service.fetching = true;
    service.fetchingErr = '';

    this.areaSearchService.getSavedQuery(queryId).subscribe({
      next: (query) => {
        service.fetching = false;
        service.name = query.name ?? service.name;
        const queryBody = query.query as AreaSearchPayload | undefined;
        service.query = { name: query.name, query: queryBody };

        if (queryBody?.geometry) {
          this.drawExistingRadius(queryBody.geometry);
        }

        if (service.property_count == null && queryBody) {
          this.areaSearchService.getCount(queryBody).subscribe({
            next: (data) => {
              service.property_count = data.rec_count;
            }
          });
        }
      },
      error: (err: Error) => {
        service.fetching = false;
        service.fetchingErr = err.message ?? 'Failed to fetch query details.';
      }
    });
  }

  private openSubscriptionPayment(): void {
    this.payNowModalService
      .open({
        mode: 'dlaSubscribe',
        priceRequired: PLA_SUBSCRIPTION_PRICE,
        plan: PLA_SUBSCRIPTION_PLAN,
        payloadExtend: { alm_dns_support: true },
        onSuccess: () => {
          this.plaService.loadSubscription(true);
          this.savedQueryDone.set(false);
          this.hydratedSubscription = false;
          this.setStatus('success', 'Your Property Lead Alerts subscription is now active.');
        }
      })
      .subscribe();
  }

  private applyRadius(
    centerLat: string,
    centerLng: string,
    stateFips: string,
    details?: SmartyAddressDetails
  ): void {
    this.queryPayload = buildPlaQueryPayload(stateFips, centerLat, centerLng);
    this.savedQueryDone.set(false);
    this.setStatus('info', '');

    this.olMapService.clearShapesLayer(this.mapObject);
    this.olMapService.createRadius(
      this.mapObject,
      { value: this.queryPayload.geometry?.value as Record<string, unknown> },
      Number(PLA_RADIUS_MILES)
    );

    if (details) {
      this.olMapService.showSearchAddressMarker(
        this.mapObject,
        Number(centerLng),
        Number(centerLat),
        details,
        { centerMap: false, panPopup: false }
      );
    }

    this.olMapService.fitMapToShapes(this.mapObject);

    this.fetchPropertyCount();
  }

  private drawExistingRadius(geometry: AreaSearchPayload['geometry']): void {
    if (!geometry?.value) {
      return;
    }

    this.olMapService.clearShapesLayer(this.mapObject);
    this.olMapService.createRadius(
      this.mapObject,
      { value: geometry.value as Record<string, unknown> },
      Number((geometry.value as Record<string, unknown>)['radius'] ?? PLA_RADIUS_MILES)
    );
    this.olMapService.fitMapToShapes(this.mapObject);
  }

  private hydrateActiveSubscription(): void {
    const subscription = this.activeSubscription();
    if (!subscription) {
      this.subscribedServices.set([]);
      return;
    }

    const services = [...((subscription.subscribed_services ?? []) as PlaSubscribedService[])];
    const primary = subscription.subscribed_service as PlaSubscribedService | undefined;

    if (primary && !services.length) {
      services.push(primary);
    }

    this.subscribedServices.set(services);

    const geometry =
      (primary?.query?.geometry as AreaSearchPayload['geometry'] | undefined) ??
      ((primary?.query?.query as AreaSearchPayload | undefined)?.geometry);

    if (geometry) {
      this.drawExistingRadius(geometry);
      return;
    }

    if (primary?.source_type === 'query' && (primary.id ?? primary.query_id) != null && !primary.name) {
      this.retryServiceDetails(primary);
    }
  }

  private resolveStateFips(stateAbbrev?: string): string | undefined {
    if (!stateAbbrev) {
      return undefined;
    }

    return US_STATE_AREA_SEARCH_OPTIONS.find((option) => option.label === stateAbbrev)?.value;
  }

  private setStatus(type: 'success' | 'error' | 'info', message: string): void {
    this.statusType.set(type);
    this.statusMessage.set(message || null);
  }
}
