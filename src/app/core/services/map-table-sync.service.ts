import { Injectable, inject } from '@angular/core';
import { OlMapService, type MapObjectRefs } from './ol-map.service';
import { SavedFarmGeometry } from '../interfaces/saved-farm.interface';

@Injectable({ providedIn: 'root' })
export class MapTableSyncService {
  private readonly olMapService = inject(OlMapService);

  showFarmGeometry(
    mapObject: MapObjectRefs,
    geometry: unknown,
    options?: { fit?: boolean; fitDuration?: number; updateInPlace?: boolean }
  ): void {
    this.olMapService.drawGeometries(
      mapObject,
      geometry as SavedFarmGeometry | SavedFarmGeometry[],
      options
    );
  }

  /** Alias for context geometry (farm boundary, search area, etc.). */
  showContextGeometry(mapObject: MapObjectRefs, geometry: unknown): void {
    this.showFarmGeometry(mapObject, geometry);
  }

  clearFarmGeometry(mapObject: MapObjectRefs): void {
    this.olMapService.clearShapesLayer(mapObject);
  }

  clearContextGeometry(mapObject: MapObjectRefs): void {
    this.clearFarmGeometry(mapObject);
  }

  showPropertyMarkers(mapObject: MapObjectRefs, rows: Record<string, unknown>[]): void {
    if (!mapObject.vectorLayer) {
      return;
    }

    mapObject.vectorLayer.getSource()?.clear();
    const markerRecords = rows
      .map((row) => ({
        ...row,
        center_lng: row['center_lng'] ?? row['sa_x_coord'],
        center_lat: row['center_lat'] ?? row['sa_y_coord']
      }))
      .filter((row) => row.center_lng != null && row.center_lat != null);

    this.olMapService.createDetailsMarkerObj(mapObject, markerRecords);
  }

  clearPropertyMarkers(mapObject: MapObjectRefs): void {
    mapObject.vectorLayer?.getSource()?.clear();
  }

  renderDetailMap(
    mapObject: MapObjectRefs,
    geometry: unknown,
    rows: Record<string, unknown>[]
  ): void {
    this.clearContextGeometry(mapObject);
    this.clearPropertyMarkers(mapObject);

    if (geometry) {
      this.showContextGeometry(mapObject, geometry);
    }

    this.showPropertyMarkers(mapObject, rows);
    this.scheduleMapResize(mapObject);
  }

  scheduleMapResize(mapObject: MapObjectRefs, delayMs = 170): void {
    setTimeout(() => {
      mapObject.map?.updateSize?.();
      this.olMapService.fitMapToShapes(mapObject);
    }, delayMs);
  }
}
