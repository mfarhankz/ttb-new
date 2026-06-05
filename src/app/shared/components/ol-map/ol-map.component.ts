import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject
} from '@angular/core';
import { MapScriptsLoaderService } from '../../../core/services/map-scripts-loader.service';
import { OlMapService, type MapObjectRefs } from '../../../core/services/ol-map.service';
import { MAP_DEFAULTS } from '../../../core/config/map.config';

declare const ol: any;

@Component({
  selector: '[appOlMap]',
  standalone: true,
  host: {
    class: 'block w-full h-full'
  },
  template: `<div #mapEl class="w-full h-full min-h-[320px]"></div>`,
  styles: [
    `
      :host ::ng-deep .ol-viewport {
        width: 100% !important;
        height: 100% !important;
      }
    `
  ]
})
export class OlMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: false }) mapEl!: ElementRef<HTMLDivElement>;

  /** Merged with map defaults. */
  @Input() options: Record<string, any> = {};
  /** Shared map context – component fills this (same object ref as in Title Toolbox). */
  @Input() mapObject: MapObjectRefs = {};
  /** When true, reset map handler may skip center reset. */
  @Input() noResetMap = false;
  /** Optional resize callback. */
  @Output() onResize = new EventEmitter<void>();

  private loader = inject(MapScriptsLoaderService);
  private olMapService = inject(OlMapService);
  private map: any = null;

  private destroyed = false;

  ngAfterViewInit(): void {
    const el = this.mapEl?.nativeElement;
    if (!el) return;

    this.loader.whenReady().then(() => {
      if (this.destroyed) return;
      this.waitForWidth(el, () => {
        if (this.destroyed) return;
        setTimeout(() => this.initializeMap(el), 0);
      });
    });
  }

  private waitForWidth(el: HTMLElement, done: () => void): void {
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      done();
      return;
    }
    const t = setInterval(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        clearInterval(t);
        done();
      }
    }, 50);
  }

  private initializeMap(mapNode: HTMLElement): void {
    if (typeof (window as any).ol === 'undefined') {
      console.error('OpenLayers (ol) not loaded');
      return;
    }
    const ol = (window as any).ol;
    const mapDefaults = this.olMapService.getMapDefaults();
    const projections = this.olMapService.getProjections();
    (mapDefaults as any).projections = projections;

    const opts = { ...mapDefaults, ...this.options } as any;
    const lonLat = opts.lonLat || MAP_DEFAULTS.lonLat;
    const zoom = opts.zoom ?? MAP_DEFAULTS.zoom;
    const numZoomLevels = opts.numZoomLevels ?? MAP_DEFAULTS.numZoomLevels;

    const tileGrid = ol.tilegrid && ol.tilegrid.createXYZ ? ol.tilegrid.createXYZ({ tileSize: 512 }) : undefined;
    const layers = [
      new ol.layer.Tile({
        visible: true,
        source: new ol.source.OSM({
          ...(tileGrid && { tileGrid }),
          transition: 0
        })
      })
    ];

    const controlsFn = ol.control.defaults?.defaults || ol.control.defaults;
    const interactionsFn = ol.interaction.defaults?.defaults || ol.interaction.defaults;
    this.map = new ol.Map({
      target: mapNode,
      layers,
      view: new ol.View({
        center: ol.proj.transform(lonLat, projections.geographic, projections.proj3857),
        zoom,
        maxZoom: numZoomLevels,
        minZoom: 6,
        enableRotation: false
      }),
      controls: controlsFn ? controlsFn({ zoom: opts.zoomControls !== false }) : undefined,
      interactions: interactionsFn ? interactionsFn({
        mouseWheelZoom: opts.mouseZoomEvent !== false,
        doubleClickZoom: opts.mouseZoomEvent !== false
      }) : undefined,
      loadTilesWhileAnimating: true,
      loadTilesWhileInteracting: true
    });

    const refs: MapObjectRefs = {
      map: this.map,
      mapNode,
      options: opts,
      geometry: {},
      showSearchBox: false,
      showSearchPopup: false,
      showDragBtn: false,
      showRadiusBtn: false,
      shapeAlertMessage: false,
      hovers: {},
      prePopupRecord: {}
    };

    this.olMapService.createLayer('vectorLayer', refs);
    this.olMapService.createLayer('shapesLayer', refs);

    refs.resetMapHandler = (r, setCenterReset) => {
      this.olMapService.clearMap(r, setCenterReset !== false);
    };

    Object.assign(this.mapObject, refs);
    if (this.map && this.map.updateSize) this.map.updateSize();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = null;
    }
  }
}
