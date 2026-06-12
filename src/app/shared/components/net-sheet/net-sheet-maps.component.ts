import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { MapScriptsLoaderService } from '@app/core/services/map-scripts-loader.service';

declare const google: any;

@Component({
  selector: 'app-net-sheet-maps',
  standalone: true,
  template: `
    <div class="maps-container net-sheet-maps-grid">
      <div class="net-sheet-map-col">
        <div #mapEl id="map_canvas" class="maps-map-view net-sheet-map-panel" aria-label="Satellite map"></div>
        @if (mapError()) {
          <div class="net-sheet-street-overlay net-sheet-map-overlay">{{ mapError() }}</div>
        }
      </div>
      <div class="net-sheet-map-col net-sheet-street-panel">
        <div #panoEl id="pano" class="maps-street-view net-sheet-pano" aria-label="Street view"></div>
        @if (streetViewError()) {
          <div class="net-sheet-street-overlay">{{ streetViewError() }}</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .net-sheet-maps-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 1rem;
        margin: 0.75rem 0 1rem;
      }

      .net-sheet-map-col {
        position: relative;
        min-width: 0;
      }

      .net-sheet-map-overlay {
        border: 1px solid #f0ad4e;
      }

      .net-sheet-map-panel,
      .net-sheet-pano {
        width: 100%;
        height: 330px;
        border-radius: 0;
        overflow: hidden;
        background: #f3f4f6;
      }

      .maps-map-view {
        border: 1px solid #f0ad4e;
      }

      .maps-street-view {
        border: 1px solid #5cb85c;
      }

      .net-sheet-street-panel {
        position: relative;
      }

      .net-sheet-street-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        text-align: center;
        font-size: 1rem;
        font-weight: 600;
        color: #666;
        background: #f3f4f6;
      }

      @media (max-width: 767px) {
        .net-sheet-maps-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .net-sheet-map-panel,
        .net-sheet-pano {
          height: 240px;
        }
      }
    `
  ]
})
export class NetSheetMapsComponent implements AfterViewInit, OnDestroy {
  readonly address = input.required<string>();
  readonly latitude = input<number | undefined>();
  readonly longitude = input<number | undefined>();

  private readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('mapEl');
  private readonly panoEl = viewChild<ElementRef<HTMLDivElement>>('panoEl');
  private readonly loader = inject(MapScriptsLoaderService);

  readonly streetViewError = signal<string | null>(null);
  readonly mapError = signal<string | null>(null);

  private map?: any;
  private panorama?: any;
  private renderToken = 0;

  constructor() {
    effect(() => {
      const address = this.address();
      const lat = this.latitude();
      const lng = this.longitude();
      if (!address?.trim()) {
        return;
      }

      untracked(() => {
        void this.renderMaps(address, lat, lng);
      });
    });
  }

  ngAfterViewInit(): void {
    void this.loader.whenGoogleReady().then(() => {
      void this.renderMaps(this.address(), this.latitude(), this.longitude());
    });
  }

  ngOnDestroy(): void {
    this.renderToken += 1;
    this.map = undefined;
    this.panorama = undefined;
  }

  private async renderMaps(address: string, lat?: number, lng?: number): Promise<void> {
    const token = ++this.renderToken;
    const mapHost = this.mapEl()?.nativeElement;
    if (!mapHost || !address?.trim()) {
      return;
    }

    await this.loader.whenGoogleReady();
    if (token !== this.renderToken || !this.loader.isGoogleMapsReady()) {
      this.mapError.set('Google Maps is not available.');
      return;
    }

    this.mapError.set(null);
    const coords = await this.resolveCoordinates(address, lat, lng);
    if (!coords || token !== this.renderToken) {
      this.mapError.set('Unable to locate this property on the map.');
      return;
    }

    const mapLatLng = new google.maps.LatLng(coords.lat, coords.lng);
    this.map = this.renderHybridMap(mapHost, mapLatLng);
    this.renderStreetView(mapLatLng, mapLatLng, token);
  }

  private resolveCoordinates(
    address: string,
    lat?: number,
    lng?: number
  ): Promise<{ lat: number; lng: number } | null> {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return Promise.resolve({ lat: lat!, lng: lng! });
    }

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status !== google.maps.GeocoderStatus.OK || !results?.[0]?.geometry?.location) {
          resolve(null);
          return;
        }

        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      });
    });
  }

  private renderHybridMap(mapHost: HTMLElement, mapLatLng: any): any {
    const map = new google.maps.Map(mapHost, {
      zoom: 19,
      center: mapLatLng,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      backgroundColor: 'transparent',
      streetViewControl: false,
      keyboardShortcuts: false,
      fullscreenControl: true,
      mapTypeControl: true
    });

    new google.maps.Marker({
      map,
      position: mapLatLng,
      animation: google.maps.Animation.DROP,
      icon: {
        url: 'https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png',
        scaledSize: new google.maps.Size(10, 10)
      }
    });

    // Maps inside modals often mount at 0×0 — resize once the panel is visible.
    requestAnimationFrame(() => {
      google.maps.event.trigger(map, 'resize');
      map.setCenter(mapLatLng);
    });
    setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
      map.setCenter(mapLatLng);
    }, 250);

    return map;
  }

  /** Mirrors legacy olFactory.mapStreetRenderStreetView — pano before service. */
  private renderStreetView(panoLatLng: any, mapLatLng: any, token: number): void {
    const panoHost = this.panoEl()?.nativeElement;
    if (!panoHost) {
      return;
    }

    panoHost.innerHTML = '';
    this.streetViewError.set(null);

    this.panorama = new google.maps.StreetViewPanorama(panoHost);
    const service = new google.maps.StreetViewService();

    service.getPanoramaByLocation(panoLatLng, 50, (panoData: any, status: string) => {
      if (token !== this.renderToken) {
        return;
      }

      if (status !== google.maps.StreetViewStatus.OK || !panoData?.location?.latLng) {
        this.streetViewError.set('No street view picture available.');
        return;
      }

      const heading = google.maps.geometry.spherical.computeHeading(panoData.location.latLng, mapLatLng);

      this.panorama.setOptions({
        position: panoLatLng,
        pov: { heading, pitch: 0, zoom: 1 },
        enableCloseButton: false,
        addressControl: false,
        fullscreenControl: true
      });

      if (this.map) {
        new google.maps.Marker({
          map: this.map,
          position: panoData.location.latLng,
          icon: {
            url: 'https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png',
            scaledSize: new google.maps.Size(10, 10)
          }
        });
      }
    });
  }
}
