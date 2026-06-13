import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MAP_CONFIG } from '@app/authenticated/map/config/map.config';

const OL_JS = 'https://cdn.jsdelivr.net/npm/ol@v7.4.0/dist/ol.js';
const OL_CSS = 'https://cdn.jsdelivr.net/npm/ol@v7.4.0/ol.css';
const GOOGLE_CALLBACK = 'onGoogleMapsLoad';

/** Global flag (same as Title Toolbox appFlags.mapScriptsLoaded). Set when OL has loaded. */
export let mapScriptsLoaded = false;
function setMapScriptsLoaded(value: boolean): void {
  mapScriptsLoaded = value;
}

@Injectable({ providedIn: 'root' })
export class MapScriptsLoaderService {
  private readonly loaded$ = new BehaviorSubject<boolean>(false);
  private readonly googleLoaded$ = new BehaviorSubject<boolean>(false);
  private loadStarted = false;

  /** Emits when both Google Maps and OpenLayers are loaded. */
  get whenLoaded(): Observable<boolean> {
    return this.loaded$.asObservable();
  }

  /** Promise that resolves when OpenLayers (and map bootstrap) is ready. */
  whenReady(): Promise<void> {
    if (mapScriptsLoaded) return Promise.resolve();
    return new Promise((resolve) => {
      const sub = this.loaded$.subscribe((loaded) => {
        if (loaded) {
          sub.unsubscribe();
          resolve();
        }
      });
    });
  }

  /** Promise that resolves when Google Maps JS API is available (for Street View / hybrid map). */
  whenGoogleReady(): Promise<void> {
    if (this.isGoogleMapsReady()) return Promise.resolve();
    return new Promise((resolve) => {
      const sub = this.googleLoaded$.subscribe((loaded) => {
        if (loaded) {
          sub.unsubscribe();
          resolve();
        }
      });
    });
  }

  isGoogleMapsReady(): boolean {
    return typeof (window as any).google !== 'undefined' && !!(window as any).google.maps;
  }

  /**
   * Load Google Maps first, then OpenLayers on callback.
   * Pass the vertical GOOGLE_API_KEY when available (legacy appConstant.GOOGLE_API_KEY).
   */
  load(apiKey?: string): void {
    if (this.loadStarted) {
      if (mapScriptsLoaded) {
        this.loaded$.next(true);
      }
      if (this.isGoogleMapsReady()) {
        this.googleLoaded$.next(true);
      }
      return;
    }
    this.loadStarted = true;
    setMapScriptsLoaded(false);

    const resolvedKey = (apiKey ?? MAP_CONFIG.googleMapsApiKey ?? '').trim();
    let olLoadScheduled = false;
    const scheduleLoadOpenLayers = (): void => {
      if (olLoadScheduled) return;
      olLoadScheduled = true;
      this.loadOpenLayers();
    };

    if (!resolvedKey) {
      scheduleLoadOpenLayers();
      return;
    }

    const googleUrl =
      `https://maps.googleapis.com/maps/api/js?v=3&libraries=places,geometry` +
      `&key=${resolvedKey}&callback=${GOOGLE_CALLBACK}&loading=async`;

    const fallbackMs = 5000;
    const fallbackTimer = setTimeout(scheduleLoadOpenLayers, fallbackMs);

    (window as any)[GOOGLE_CALLBACK] = () => {
      clearTimeout(fallbackTimer);
      this.googleLoaded$.next(true);
      scheduleLoadOpenLayers();
    };

    const script = document.createElement('script');
    script.src = googleUrl;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(fallbackTimer);
      console.error('Google Maps failed to load');
      scheduleLoadOpenLayers();
    };
    document.head.appendChild(script);
  }

  private loadOpenLayers(): void {
    if (mapScriptsLoaded) {
      this.loaded$.next(true);
      return;
    }

    if (!document.querySelector(`link[href="${OL_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = OL_CSS;
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = OL_JS;
    script.async = true;
    script.onload = () => {
      setMapScriptsLoaded(true);
      this.loaded$.next(true);
    };
    script.onerror = () => {
      console.error('OpenLayers failed to load');
    };
    document.head.appendChild(script);
  }
}
