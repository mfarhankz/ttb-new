import { Injectable } from '@angular/core';
import { MAP_DEFAULTS, DEFAULT_LON_LAT } from '../config/map.config';

const METERS_PER_MILE = 1609.344;
/** Legacy olFactory.et() — Web Mercator circle display adjustment. */
const LEGACY_CIRCLE_RADIUS_ADJUST = 1.195;

/** OpenLayers global (loaded from CDN v7.4.0). */
declare const ol: any;

export interface MapObjectRefs {
  map?: any;
  mapNode?: HTMLElement;
  vectorLayer?: any;
  shapesLayer?: any;
  options?: any;
  resetMapHandler?: (refs: MapObjectRefs, setCenterReset?: boolean) => void;
  geometry?: { match?: string; value?: any };
  showSearchBox?: boolean;
  showSearchPopup?: boolean;
  showDragBtn?: boolean;
  showRadiusBtn?: boolean;
  shapeAlertMessage?: boolean | string;
  hovers?: { hoverOnTract?: boolean; hoverOnFarm?: boolean };
  popupOverlay?: any;
  tooltipOverlay?: any;
  prePopupRecord?: any;
  [key: string]: any;
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
    if (refs.popupOverlay && refs.map.getOverlays().length) {
      refs.map.removeOverlay(refs.popupOverlay);
    }
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
    _pipelineObj?: any,
    _tractsMode?: boolean,
    _options?: any
  ): void {
    if (!refs.map || !refs.shapesLayer) return;
    const prevDraw = (refs as any).drawInteraction;
    if (prevDraw) {
      refs.map.removeInteraction(prevDraw);
      (refs as any).drawInteraction = null;
    }
    const source = refs.shapesLayer.getSource();
    const geometryType = shape === 'circle' ? 'Circle' : 'Polygon';
    const draw = new ol.interaction.Draw({
      source,
      type: geometryType
    });
    draw.on('drawend', (e: any) => {
      const feat = e.feature;
      if (refs.geometry) refs.geometry = { match: shape, value: feat };
    });
    refs.map.addInteraction(draw);
    (refs as any).drawInteraction = draw;
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
    refs.shapesLayer?.getSource()?.clear();
  }

  /** Draw legacy farm/search geometry objects on the shapes layer. */
  drawGeometries(refs: MapObjectRefs, geometryInput: unknown): void {
    if (!refs.shapesLayer || geometryInput == null) {
      return;
    }

    // Legacy onFarmMouseEnter unwraps single-item geometry arrays.
    let normalizedInput = geometryInput;
    if (Array.isArray(geometryInput) && geometryInput.length === 1) {
      normalizedInput = geometryInput[0];
    }

    this.clearShapesLayer(refs);

    const geometries = this.normalizeGeometries(normalizedInput);
    geometries.forEach((geometry) => this.drawSingleGeometry(refs, geometry));

    if (refs.map?.updateSize) {
      refs.map.updateSize();
    }

    this.fitMapToShapes(refs);
  }

  /** Fit map view to current shape features. */
  fitMapToShapes(refs: MapObjectRefs): void {
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

    refs.map.getView().fit(extent, { padding: [40, 40, 40, 40], maxZoom: 16, duration: 250 });
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
    records.forEach((r: any, i: number) => {
      const lon = r.center_lng ?? r.longitude ?? r.lng;
      const lat = r.center_lat ?? r.latitude ?? r.lat;
      if (lon == null || lat == null) return;
      const coord = ol.proj.transform([Number(lon), Number(lat)], proj.geographic, proj.proj3857);
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(coord),
        index: i,
        ...r
      });
      source.addFeature(feature);
    });
  }

  /** Fill address from Google Place (geocoding) – stub; wire to Google Geocoder when needed. */
  fillInAddress(_place: any, _details: any): void {
    // Use Google Geocoder / Places to fill address
  }

  activatedHighlight(_status?: boolean): void {}
  deactivatedHighlight(_status?: boolean): void {}
}
