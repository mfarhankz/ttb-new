import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MAP_CONFIG } from '../config/map.config';

const OL_JS = 'https://cdn.jsdelivr.net/npm/ol@v7.4.0/dist/ol.js';
const OL_CSS = 'https://cdn.jsdelivr.net/npm/ol@v7.4.0/ol.css';
const GOOGLE_CALLBACK = 'onGoogleMapsLoad';

/** Global flag (same as Title Toolbox appFlags.mapScriptsLoaded). Set by MapScriptsLoaderService when OL has loaded. */
export let mapScriptsLoaded = false;
function setMapScriptsLoaded(value: boolean): void {
  mapScriptsLoaded = value;
}

@Injectable({ providedIn: 'root' })
export class MapScriptsLoaderService {
  private readonly loaded$ = new BehaviorSubject<boolean>(false);

  /** Emits when both Google Maps and OpenLayers are loaded. */
  get whenLoaded(): Observable<boolean> {
    return this.loaded$.asObservable();
  }

  /** Promise that resolves when scripts are ready. */
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

  /** Load Google Maps first, then OpenLayers on callback. If Google fails or has no key, load OpenLayers after fallbackMs so map still works. */
  load(): void {
    if (mapScriptsLoaded) {
      this.loaded$.next(true);
      return;
    }
    setMapScriptsLoaded(false);

    const apiKey = MAP_CONFIG.googleMapsApiKey;
    let olLoadScheduled = false;
    const scheduleLoadOpenLayers = (): void => {
      if (olLoadScheduled) return;
      olLoadScheduled = true;
      this.loadOpenLayers();
    };

    if (!apiKey) {
      // No API key: load OpenLayers immediately so the map works without waiting for Google
      scheduleLoadOpenLayers();
      return;
    }

    const googleUrl =
      `https://maps.googleapis.com/maps/api/js?v=3&libraries=places` +
      `&key=${apiKey}&callback=${GOOGLE_CALLBACK}&loading=async`;

    const fallbackMs = 2000;
    const fallbackTimer = setTimeout(scheduleLoadOpenLayers, fallbackMs);

    (window as any)[GOOGLE_CALLBACK] = () => {
      clearTimeout(fallbackTimer);
      scheduleLoadOpenLayers();
    };

    const script = document.createElement('script');
    script.src = googleUrl;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(fallbackTimer);
      scheduleLoadOpenLayers();
    };
    document.head.appendChild(script);
  }

  private loadOpenLayers(): void {
    // Inject OL CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = OL_CSS;
    document.head.appendChild(link);

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
