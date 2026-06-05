import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../../shared/components';
import { LayoutService } from '../../../core/services/layout.service';
import { OlMapComponent } from '../../../shared/components/ol-map/ol-map.component';
import { OlMapService, type MapObjectRefs } from '../../../core/services/ol-map.service';
import { MAP_DEFAULTS } from '../../../core/config/map.config';

export type FarmingMapMode = 'radius' | 'boundary';

@Component({
  selector: 'app-farming',
  standalone: true,
  imports: [ButtonComponent, OlMapComponent],
  templateUrl: './farming.component.html',
  styles: [`
    .farming-map-wrap {
      position: fixed;
      top: 0;
      left: var(--sidebar-width, 260px);
      right: 0;
      bottom: 0;
      z-index: 0;
      background: #f3f4f6;
      transition: left 0.2s ease;
    }
    .farming-map-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .farming-map-inner {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
    }
    .farming-map-toolbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem 1rem;
      background: rgb(255 255 255 / 54%);
      border-bottom: 1px solid #e5e7eb;
    }
  `]
})
export class FarmingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private olMapService = inject(OlMapService);
  private layoutService = inject(LayoutService);
  private sidebarResizeSub?: Subscription;
  private mapReadyAttempts = 0;

  mapObject: MapObjectRefs = {};
  mapOptions = {
    lonLat: MAP_DEFAULTS.lonLat,
    zoom: MAP_DEFAULTS.zoom,
    calculateHeight: false,
    listenResize: true
  };

  ngOnInit(): void {
    this.sidebarResizeSub = this.layoutService.onSidebarResize.subscribe(() => {
      setTimeout(() => this.mapObject.map?.updateSize?.(), 220);
    });

    this.route.data.subscribe((data) => {
      const mode = data['mapMode'] as FarmingMapMode | undefined;
      if (mode) {
        this.scheduleMapMode(mode);
      }
    });
  }

  ngOnDestroy(): void {
    this.sidebarResizeSub?.unsubscribe();
  }

  onClearSearch(): void {
    if (!this.mapObject.resetMapHandler) return;
    this.mapObject.resetMapHandler(this.mapObject, false);
    this.mapObject.geometry = {};
    this.mapObject.showSearchBox = false;
    this.mapObject.showRadiusBtn = false;
    this.mapObject.showDragBtn = false;
    this.mapObject.shapeAlertMessage = false;
  }

  private scheduleMapMode(mode: FarmingMapMode): void {
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

  private activateMapMode(mode: FarmingMapMode): void {
    this.olMapService.clearMap(this.mapObject, false);
    if (mode === 'radius') {
      this.olMapService.createShapeFeature(this.mapObject, 'circle');
      this.mapObject.showRadiusBtn = true;
      this.mapObject.showSearchBox = false;
    } else {
      this.olMapService.createShapeFeature(this.mapObject, 'polygon');
      this.mapObject.showDragBtn = false;
      this.mapObject.showSearchBox = false;
    }
  }
}
