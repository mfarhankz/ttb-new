import { Injectable, inject } from '@angular/core';
import { OlMapService, type MapObjectRefs } from './ol-map.service';
import { SavedFarmGeometry } from '../interfaces/saved-farm.interface';

@Injectable({ providedIn: 'root' })
export class MapTableSyncService {
  private readonly olMapService = inject(OlMapService);

  showFarmGeometry(mapObject: MapObjectRefs, geometry: unknown): void {
    this.olMapService.drawGeometries(mapObject, geometry as SavedFarmGeometry | SavedFarmGeometry[]);
  }

  clearFarmGeometry(mapObject: MapObjectRefs): void {
    this.olMapService.clearShapesLayer(mapObject);
  }

  scheduleMapResize(mapObject: MapObjectRefs, delayMs = 170): void {
    setTimeout(() => {
      mapObject.map?.updateSize?.();
      this.olMapService.fitMapToShapes(mapObject);
    }, delayMs);
  }
}
