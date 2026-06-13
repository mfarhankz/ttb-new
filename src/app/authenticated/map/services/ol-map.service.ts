import { Injectable } from '@angular/core';
import { MAP_DEFAULTS, DEFAULT_LON_LAT } from '@app/authenticated/map/config/map.config';
import { SmartyAddressDetails } from '@app/core/interfaces/smarty.interface';
import { formatSearchAddressMarkup } from '@app/core/utils/map-search-address.util';

const METERS_PER_MILE = 1609.344;
/** Legacy olFactory.et() — Web Mercator circle display adjustment. */
const LEGACY_CIRCLE_RADIUS_ADJUST = 1.195;

/** OpenLayers global (loaded from CDN v7.4.0). */
declare const ol: any;

export interface MapDrawnGeometry {
  match: 'circle' | 'polygon';
  value: {
    center_lng?: string;
    center_lat?: string;
    radius?: string;
    wkt?: string;
  };
}

export interface MapObjectRefs {
  map?: any;
  mapNode?: HTMLElement;
  vectorLayer?: any;
  shapesLayer?: any;
  options?: any;
  resetMapHandler?: (refs: MapObjectRefs, setCenterReset?: boolean) => void;
  geometry?: MapDrawnGeometry;
  showSearchBox?: boolean;
  showSearchPopup?: boolean;
  showDragBtn?: boolean;
  showRadiusBtn?: boolean;
  shapeAlertMessage?: boolean | string;
  topPolygonLength?: string;
  hovers?: { hoverOnTract?: boolean; hoverOnFarm?: boolean };
  popupOverlay?: any;
  tooltipOverlay?: any;
  prePopupRecord?: any;
  popupElement?: HTMLElement;
  popupContentElement?: HTMLElement;
  popupCloserElement?: HTMLElement;
  searchAddressPopupTimer?: ReturnType<typeof setTimeout>;
  [key: string]: any;
}

export interface CreateShapeFeatureOptions {
  onDrawComplete?: (geometry: MapDrawnGeometry, label: string) => void;
  onGeometryChange?: (geometry: MapDrawnGeometry, label: string) => void;
}

@Injectable({ providedIn: 'root' })
export class OlMapService {
  private geoLocationIsActivated = false;

  getMapDefaults(): typeof MAP_DEFAULTS & { projections?: { geographic: string; proj3857: string } } {
    return { ...MAP_DEFAULTS };
  }

  getProjections(): { geographic: string; proj3857: string } {
    return {
      geographic: MAP_DEFAULTS.projections.geographic,
      proj3857: MAP_DEFAULTS.projections.proj3857
    };
  }

  createProjections(): { geographic: string; proj3857: string } {
    return this.getProjections();
  }

  setGeoLocationIsActivated(value: boolean): void {
    this.geoLocationIsActivated = value;
  }

  getGeoLocationIsActivated(): boolean {
    return this.geoLocationIsActivated;
  }

  /** Create vector layer (result features) or shapes layer (user-drawn shapes). */
  createLayer(layerName: 'vectorLayer' | 'shapesLayer', refs: MapObjectRefs): void {
    const source = new ol.source.Vector();
    const layer = new ol.layer.Vector({ source });

    if (layerName === 'shapesLayer') {
      layer.setStyle(this.getShapesLayerStyle());
      layer.setZIndex(1);
    } else {
      layer.setZIndex(2);
    }

    (refs as any)[layerName] = layer;
    if (refs.map) refs.map.addLayer(layer);
  }

  /** Legacy olFactory layer style for radius / polygon shapes. */
  private getShapesLayerStyle(): any {
    const { fill, stroke, strokeWidth } = MAP_DEFAULTS.shapesLayerStyle;
    return new ol.style.Style({
      fill: new ol.style.Fill({ color: fill }),
      stroke: new ol.style.Stroke({ color: stroke, width: strokeWidth })
    });
  }

  /** Clear map: clear vector and shapes layers, optionally reset center/zoom. */
  clearMap(refs: MapObjectRefs, setCenterReset = true, _options?: any): void {
    if (!refs.map) return;
    const proj = this.getProjections();
    if (setCenterReset && refs.options?.lonLat) {
      refs.map.getView().setCenter(
        ol.proj.transform(refs.options.lonLat, proj.geographic, proj.proj3857)
      );
      refs.map.getView().setZoom(refs.options.zoom ?? MAP_DEFAULTS.zoom);
    }
    this.hideSearchAddressPopup(refs);
    if (refs.vectorLayer?.getSource()) refs.vectorLayer.getSource().clear();
    if (refs.shapesLayer?.getSource()) refs.shapesLayer.getSource().clear();
    if (refs.prePopupRecord) refs.prePopupRecord = {};
  }

  /** Remove popup overlay from map. */
  removePopupOverlay(refs: MapObjectRefs): void {
    if (refs.map && refs.popupOverlay) {
      refs.map.removeOverlay(refs.popupOverlay);
    }
  }

  /** Create circle shape (radius search). */
  createRadius(
    refs: MapObjectRefs,
    geometry: { value?: { center_lng?: number; center_lat?: number; radius?: number } },
    radiusInMeters: number,
    _calculateLength?: boolean,
    _dragEnabled?: boolean
  ): any {
    if (!refs.shapesLayer || !geometry?.value) return null;
    const proj = this.getProjections();
    const center = ol.proj.transform(
      [Number(geometry.value.center_lng), Number(geometry.value.center_lat)],
      proj.geographic,
      proj.proj3857
    );
    const radiusMiles = Number(geometry.value.radius ?? 0);
    const radius = this.milesToMapRadius(radiusMiles);
    const circle = new ol.geom.Circle(center, radius);
    const feature = new ol.Feature({ geometry: circle });
    feature.setId('circle');
    refs.shapesLayer.getSource().addFeature(feature);
    return feature;
  }

  /** Convert saved-farm radius (miles) to OpenLayers circle radius (meters). */
  private milesToMapRadius(miles: number): number {
    if (!Number.isFinite(miles) || miles <= 0) {
      return 0;
    }

    return miles * METERS_PER_MILE * LEGACY_CIRCLE_RADIUS_ADJUST;
  }

  /** Change radius of existing circle. */
  changeRadiusLength(refs: MapObjectRefs, radiusInMeters: number, _shapeType: string): void {
    const source = refs.shapesLayer?.getSource();
    if (!source) return;
    const features = source.getFeatures();
    const circleFeature = features.find((f: any) => f.getId() === 'circle');
    if (circleFeature) {
      const geom = circleFeature.getGeometry();
      const center = geom.getCenter();
      geom.setRadius(radiusInMeters);
    }
  }

  /** Create draw interaction for circle or polygon. Removes any existing draw interaction first. */
  createShapeFeature(
    refs: MapObjectRefs,
    shape: 'circle' | 'polygon',
    options: CreateShapeFeatureOptions = {}
  ): void {
    if (!refs.map || !refs.shapesLayer) return;
    this.removeDrawInteraction(refs);
    const source = refs.shapesLayer.getSource();
    const geometryType = shape === 'circle' ? 'Circle' : 'Polygon';
    const draw = new ol.interaction.Draw({
      source,
      type: geometryType
    });

    draw.on('drawstart', () => {
      source.clear();
      refs.geometry = undefined;
      refs.shapeAlertMessage = false;
      refs.topPolygonLength = '';
    });

    draw.on('drawend', (e: any) => {
      const feature = e.feature;
      feature.setId(shape === 'circle' ? 'circle' : 'polygon');
      this.removeDrawInteraction(refs);

      const geometry = this.serializeDrawnFeature(feature, shape);
      if (!geometry) {
        return;
      }

      const label =
        shape === 'circle'
          ? `Selected Radius : ${geometry.value.radius} miles`
          : 'Selected Boundary';

      refs.geometry = geometry;
      refs.shapeAlertMessage = label;
      refs.topPolygonLength = shape === 'circle' ? label : '';
      refs.showSearchBox = false;
      refs.showRadiusBtn = shape === 'circle';

      options.onDrawComplete?.(geometry, label);
      this.activateShapeEditing(refs, shape, options);
      this.fitMapToShapes(refs);
    });

    refs.map.addInteraction(draw);
    (refs as any).drawInteraction = draw;

    if (shape === 'polygon') {
      const snap = new ol.interaction.Snap({ source });
      refs.map.addInteraction(snap);
      (refs as any).snapInteraction = snap;
    }
  }

  /** Enable drag-to-move and edit handles after a shape is drawn (legacy parity). */
  activateShapeEditing(
    refs: MapObjectRefs,
    shape: 'circle' | 'polygon',
    options: CreateShapeFeatureOptions = {}
  ): void {
    if (!refs.map || !refs.shapesLayer) {
      return;
    }

    this.removeShapeEditInteractions(refs);

    const source = refs.shapesLayer.getSource();
    const featureId = shape === 'circle' ? 'circle' : 'polygon';

    const syncGeometryFromMap = (): void => {
      const feature = source
        .getFeatures()
        .find((f: any) => f.getId() === featureId);
      if (!feature) {
        return;
      }

      const geometry = this.serializeDrawnFeature(feature, shape);
      if (!geometry) {
        return;
      }

      const label =
        shape === 'circle'
          ? `Selected Radius : ${geometry.value.radius} miles`
          : 'Selected Boundary';

      refs.geometry = geometry;
      refs.shapeAlertMessage = label;
      refs.topPolygonLength = shape === 'circle' ? label : '';
      options.onGeometryChange?.(geometry, label);
    };

    const translate = new ol.interaction.Translate({
      layers: [refs.shapesLayer]
    });
    translate.on('translateend', syncGeometryFromMap);
    refs.map.addInteraction(translate);
    (refs as any).translateInteraction = translate;
    translate.setActive(true);

    const modify = new ol.interaction.Modify({
      source,
      deleteCondition: ol.events.condition.never,
      insertVertexCondition: ol.events.condition.never
    });
    modify.on('modifyend', syncGeometryFromMap);
    refs.map.addInteraction(modify);
    (refs as any).modifyInteraction = modify;
  }

  removeShapeEditInteractions(refs: MapObjectRefs): void {
    for (const key of ['translateInteraction', 'modifyInteraction', 'snapInteraction']) {
      const interaction = (refs as any)[key];
      if (interaction && refs.map) {
        refs.map.removeInteraction(interaction);
        (refs as any)[key] = null;
      }
    }
  }

  removeDrawInteraction(refs: MapObjectRefs): void {
    const prevDraw = (refs as any).drawInteraction;
    if (prevDraw && refs.map) {
      refs.map.removeInteraction(prevDraw);
      (refs as any).drawInteraction = null;
    }
    this.removeShapeEditInteractions(refs);
  }

  centerMapOnCoordinates(refs: MapObjectRefs, lon: number, lat: number, zoom = 14): void {
    if (!refs.map || !Number.isFinite(lon) || !Number.isFinite(lat)) {
      return;
    }

    const proj = this.getProjections();
    refs.map.getView().setCenter(ol.proj.transform([lon, lat], proj.geographic, proj.proj3857));
    refs.map.getView().setZoom(zoom);
  }

  /** Legacy clearMarkerPopup — remove search/address pins and hide popup. */
  clearSearchAddressMarker(refs: MapObjectRefs): void {
    if (refs.searchAddressPopupTimer) {
      clearTimeout(refs.searchAddressPopupTimer);
      refs.searchAddressPopupTimer = undefined;
    }

    refs.vectorLayer?.getSource()?.clear();
    this.hideSearchAddressPopup(refs);
  }

  /** Show green pin + address details popup after autocomplete selection. */
  showSearchAddressMarker(
    refs: MapObjectRefs,
    lon: number,
    lat: number,
    details: SmartyAddressDetails,
    options: { zoom?: number; centerMap?: boolean; panPopup?: boolean } = {}
  ): void {
    if (!refs.map || !refs.vectorLayer || !Number.isFinite(lon) || !Number.isFinite(lat)) {
      return;
    }

    const { zoom = 14, centerMap = true, panPopup = true } = options;

    this.clearSearchAddressMarker(refs);

    const proj = this.getProjections();
    const coord = ol.proj.transform([lon, lat], proj.geographic, proj.proj3857);
    const markup = formatSearchAddressMarkup(details);
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(coord),
      html: markup,
      isSearchAddress: true
    });

    feature.setId('search-address-pin');
    feature.setStyle(this.createSearchPinStyle());
    refs.vectorLayer.getSource().addFeature(feature);

    if (centerMap) {
      this.centerMapOnCoordinates(refs, lon, lat, zoom);
    }

    this.scheduleSearchAddressPopup(refs, coord, markup, panPopup);
  }

  private createSearchPinStyle(): any {
    return new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: '/assets/images/_map-pin-green.png'
      })
    });
  }

  private scheduleSearchAddressPopup(
    refs: MapObjectRefs,
    coordinate: number[],
    markup: string,
    panPopup = true
  ): void {
    refs.searchAddressPopupTimer = setTimeout(() => {
      refs.searchAddressPopupTimer = undefined;
      this.openSearchAddressPopup(refs, coordinate, markup, panPopup);
    }, 300);
  }

  private openSearchAddressPopup(
    refs: MapObjectRefs,
    coordinate: number[],
    markup: string,
    panPopup = true
  ): void {
    const overlay = this.ensurePopupOverlay(refs);
    const popup = refs.popupElement;
    const content = refs.popupContentElement;

    if (!overlay || !popup || !content) {
      return;
    }

    content.innerHTML = markup;
    popup.classList.remove('lg-dash-popup', 'lg-PH-EM-popup', 'lg-footer-popup');
    popup.classList.add('sm-search-popup');
    overlay.setPosition(coordinate);
    popup.classList.remove('hidden');

    const closer = refs.popupCloserElement;
    if (closer && !closer.dataset['bound']) {
      closer.dataset['bound'] = 'true';
      closer.addEventListener('click', (event) => {
        event.preventDefault();
        this.hideSearchAddressPopup(refs);
      });
    }

    if (panPopup) {
      overlay.panIntoView?.({ margin: 15, animation: { duration: 0 } });
    }
  }

  private ensurePopupOverlay(refs: MapObjectRefs): any {
    if (!refs.map || !refs.popupElement) {
      return null;
    }

    let overlay = refs.popupOverlay ?? refs.map.getOverlayById?.('popupOverlay');
    if (!overlay) {
      overlay = new ol.Overlay({
        element: refs.popupElement,
        id: 'popupOverlay',
        positioning: 'bottom-center',
        stopEvent: true,
        offset: [0, -12]
      });
      refs.map.addOverlay(overlay);
      refs.popupOverlay = overlay;
    }

    return overlay;
  }

  private hideSearchAddressPopup(refs: MapObjectRefs): void {
    refs.popupOverlay?.setPosition(undefined);
    refs.popupElement?.classList.add('hidden');
    refs.popupContentElement && (refs.popupContentElement.innerHTML = '');
  }

  private serializeDrawnFeature(feature: any, shape: 'circle' | 'polygon'): MapDrawnGeometry | null {
    const geometry = feature?.getGeometry?.();
    if (!geometry) {
      return null;
    }

    if (shape === 'circle') {
      const value = this.serializeCircleGeometry(geometry);
      return value ? { match: 'circle', value } : null;
    }

    const value = this.serializePolygonGeometry(geometry);
    return value ? { match: 'polygon', value } : null;
  }

  private serializeCircleGeometry(circleGeom: any): MapDrawnGeometry['value'] | null {
    const proj = this.getProjections();
    const center = ol.proj.transform(circleGeom.getCenter(), proj.proj3857, proj.geographic);
    const radiusMeters = Number(circleGeom.getRadius());
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      return null;
    }

    const radiusMiles = radiusMeters / LEGACY_CIRCLE_RADIUS_ADJUST / METERS_PER_MILE;
    return {
      center_lng: String(center[0]),
      center_lat: String(center[1]),
      radius: String(Number(radiusMiles.toFixed(3)))
    };
  }

  private serializePolygonGeometry(polygonGeom: any): MapDrawnGeometry['value'] | null {
    const proj = this.getProjections();
    const cloned = polygonGeom.clone();
    cloned.transform(proj.proj3857, proj.geographic);
    const wktFormat = new ol.format.WKT();
    const feature = new ol.Feature({ geometry: cloned });
    const wkt = wktFormat.writeFeature(feature);
    return wkt ? { wkt } : null;
  }

  /** Draw multiple polygons (e.g. tracts) from WKT or geometries. */
  createMultiPolygons(
    refs: MapObjectRefs,
    geometries: Array<{ wkt?: string }>,
    _deactivateModify?: boolean,
    _hideLabel?: boolean
  ): void {
    if (!refs.shapesLayer || !geometries?.length) return;
    const source = refs.shapesLayer.getSource();
    const wktFormat = new ol.format.WKT();
    const proj = this.getProjections();
    geometries.forEach((g) => {
      if (g.wkt) {
        const feature = wktFormat.readFeature(g.wkt, {
          dataProjection: proj.geographic,
          featureProjection: proj.proj3857
        });
        source.addFeature(feature);
      }
    });
  }

  /** Clear user-drawn / preview shapes without resetting map center. */
  clearShapesLayer(refs: MapObjectRefs): void {
    this.removeShapeEditInteractions(refs);
    refs.shapesLayer?.getSource()?.clear();
    refs.geometry = undefined;
    refs.shapeAlertMessage = false;
    refs.topPolygonLength = '';
  }

  /** Draw legacy farm/search geometry objects on the shapes layer. */
  drawGeometries(
    refs: MapObjectRefs,
    geometryInput: unknown,
    options: { fit?: boolean; fitDuration?: number; updateInPlace?: boolean } = {}
  ): void {
    if (!refs.shapesLayer || geometryInput == null) {
      return;
    }

    const { fit = true, fitDuration = 350, updateInPlace = true } = options;

    // Legacy onFarmMouseEnter unwraps single-item geometry arrays.
    let normalizedInput = geometryInput;
    if (Array.isArray(geometryInput) && geometryInput.length === 1) {
      normalizedInput = geometryInput[0];
    }

    const geometries = this.normalizeGeometries(normalizedInput);

    if (updateInPlace && geometries.length === 1 && this.updateRadiusCircle(refs, geometries[0])) {
      if (refs.map?.updateSize) {
        refs.map.updateSize();
      }
      if (fit) {
        this.scheduleFitToShapes(refs, fitDuration);
      }
      return;
    }

    this.clearShapesLayer(refs);
    geometries.forEach((geometry) => this.drawSingleGeometry(refs, geometry));

    if (refs.map?.updateSize) {
      refs.map.updateSize();
    }

    if (fit) {
      this.scheduleFitToShapes(refs, fitDuration);
    }
  }

  /** Legacy setCenterOnMap — defer fit one tick so the shape is rendered first. */
  private scheduleFitToShapes(refs: MapObjectRefs, duration: number): void {
    setTimeout(() => this.fitMapToShapes(refs, duration), 0);
  }

  /** Update an existing preview circle in place (smooth farm row hover). */
  private updateRadiusCircle(refs: MapObjectRefs, geometry: Record<string, unknown>): boolean {
    const shapeType = String(geometry['match'] ?? geometry['type'] ?? '').toLowerCase();
    if (shapeType !== 'circle') {
      return false;
    }

    const value = geometry['value'] as Record<string, unknown> | undefined;
    if (!value) {
      return false;
    }

    const source = refs.shapesLayer?.getSource();
    if (!source) {
      return false;
    }

    const circleFeature = source
      .getFeatures()
      .find((feature: any) => feature.getId() === 'circle');
    if (!circleFeature) {
      return false;
    }

    const centerLng = Number(value['center_lng']);
    const centerLat = Number(value['center_lat']);
    const radiusMiles = Number(value['radius'] ?? 0);
    if (!Number.isFinite(centerLng) || !Number.isFinite(centerLat)) {
      return false;
    }

    const proj = this.getProjections();
    const center = ol.proj.transform([centerLng, centerLat], proj.geographic, proj.proj3857);
    const geom = circleFeature.getGeometry();
    geom.setCenter(center);
    geom.setRadius(this.milesToMapRadius(radiusMiles));
    return true;
  }

  /** Fit map view to current shape features. */
  fitMapToShapes(refs: MapObjectRefs, duration = 350): void {
    const source = refs.shapesLayer?.getSource();
    if (!refs.map || !source) {
      return;
    }

    const features = source.getFeatures();
    if (!features.length) {
      return;
    }

    const extent = source.getExtent();
    if (extent.some((value: number) => !Number.isFinite(value))) {
      return;
    }

    // Legacy setCenterOnMap uses view.fit(extent) with no padding when snapping on hover.
    const fitOptions: { duration: number; padding?: number[]; maxZoom?: number } = { duration };
    if (duration > 0) {
      fitOptions.padding = [40, 40, 40, 40];
      fitOptions.maxZoom = 16;
    }

    refs.map.getView().fit(extent, fitOptions);
  }

  private normalizeGeometries(input: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(input)) {
      return input.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
    }

    if (typeof input === 'object' && input !== null) {
      return [input as Record<string, unknown>];
    }

    return [];
  }

  private drawSingleGeometry(refs: MapObjectRefs, geometry: Record<string, unknown>): void {
    const value = geometry['value'] as Record<string, unknown> | undefined;
    if (!value) {
      return;
    }

    const shapeType = String(geometry['match'] ?? geometry['type'] ?? '').toLowerCase();

    if (shapeType === 'circle') {
      this.createRadius(
        refs,
        {
          value: {
            center_lng: value['center_lng'] as number | undefined,
            center_lat: value['center_lat'] as number | undefined,
            radius: value['radius'] as number | undefined
          }
        },
        Number(value['radius'] ?? 0)
      );
      return;
    }

    if (shapeType === 'polygon' && typeof value['wkt'] === 'string') {
      this.createMultiPolygons(refs, [{ wkt: value['wkt'] }]);
    }
  }

  /** Create markers for property/record details. */
  createDetailsMarkerObj(refs: MapObjectRefs, records: any[]): void {
    if (!refs.vectorLayer || !records?.length) return;
    const source = refs.vectorLayer.getSource();
    const proj = this.getProjections();

    records.forEach((record: any, index: number) => {
      const lon = record.center_lng ?? record.longitude ?? record.lng ?? record.sa_x_coord;
      const lat = record.center_lat ?? record.latitude ?? record.lat ?? record.sa_y_coord;
      if (lon == null || lat == null) return;

      const coord = ol.proj.transform([Number(lon), Number(lat)], proj.geographic, proj.proj3857);
      const serialNumber = Number(record.serialNumber ?? record.serial_number ?? index + 1);
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(coord),
        index: serialNumber,
        serialNumber,
        ...record
      });

      feature.setId(`pointer-hover-${serialNumber}`);
      feature.setStyle(this.createMarkerPinStyle(record, serialNumber));
      source.addFeature(feature);
    });
  }

  /** Legacy olFactory.markerPinImageWithText — pin image with serial number label. */
  private createMarkerPinStyle(record: any, serialNumber: number, highlighted = false): any {
    const imageSrc =
      record.sa_site_mail_same === 'Y'
        ? '/assets/images/_map-pin-green.png'
        : '/assets/images/_pin.png';

    return new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: imageSrc
      }),
      text: new ol.style.Text({
        text: String(serialNumber),
        font: 'bold 14px Calibri, sans-serif',
        offsetY: -25,
        fill: new ol.style.Fill({
          color: highlighted ? '#00AAFF' : '#f9f9f9'
        }),
        stroke: new ol.style.Stroke({
          color: highlighted ? '#079ca5' : 'rgb(113, 113, 113)',
          width: 0.5
        })
      })
    });
  }

  /** Fill address from geocoder result – reserved for map pin / reverse geocode. */
  fillInAddress(_place: unknown, _details: Record<string, unknown>): void {}

  activatedHighlight(_status?: boolean): void {}
  deactivatedHighlight(_status?: boolean): void {}
}
