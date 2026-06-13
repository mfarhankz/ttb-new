import { Component, ViewChild, inject, signal } from '@angular/core';
import { AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { MAP_DEFAULTS } from '@app/authenticated/map/config/map.config';
import { OlMapService, type MapObjectRefs } from '@app/authenticated/map/services/ol-map.service';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { OlMapComponent } from '@app/shared/widgets/ol-map/ol-map.component';

@Component({
  selector: 'app-area-search-geometry-preview',
  standalone: true,
  imports: [ModalComponent, OlMapComponent],
  template: `
    <app-modal #geometryMapModal title="Geometry Preview" size="sm" [showFooter]="false">
      <div class="relative">
        <button
          type="button"
          class="absolute top-2 right-2 z-10 text-body-sm font-medium text-primary underline"
          (click)="close()"
        >
          Close
        </button>
        <div class="h-[250px] w-full overflow-hidden rounded-md border border-border">
          <div appOlMap [mapObject]="mapObject" [options]="mapOptions" class="h-full w-full"></div>
        </div>
      </div>
    </app-modal>
  `
})
export class AreaSearchGeometryPreviewComponent {
  @ViewChild('geometryMapModal') private modal?: ModalComponent;

  private readonly olMapService = inject(OlMapService);
  private mapReadyAttempts = 0;

  readonly mapObject: MapObjectRefs = {};
  readonly mapOptions = {
    lonLat: MAP_DEFAULTS.lonLat,
    zoom: MAP_DEFAULTS.zoom,
    zoomControls: false,
    mouseZoomEvent: false,
    calculateHeight: false,
    listenResize: false
  };

  private readonly geometry = signal<AreaSearchFormFieldValue | null>(null);

  open(geometry: AreaSearchFormFieldValue | undefined): void {
    if (!geometry?.match || geometry.value == null) {
      return;
    }

    this.geometry.set(geometry);
    this.modal?.open();
    this.mapReadyAttempts = 0;
    this.scheduleDraw();
  }

  close(): void {
    this.modal?.close();
    this.olMapService.clearMap(this.mapObject, false);
    this.geometry.set(null);
  }

  private scheduleDraw(): void {
    const tryDraw = (): void => {
      if (this.mapObject.map && this.mapObject.shapesLayer) {
        this.olMapService.clearMap(this.mapObject, false);
        this.olMapService.drawGeometries(this.mapObject, {
          match: this.geometry()?.match,
          value: this.geometry()?.value
        });
        this.mapObject.map.updateSize?.();
        return;
      }

      if (this.mapReadyAttempts++ < 50) {
        setTimeout(tryDraw, 100);
      }
    };

    setTimeout(tryDraw, 0);
  }
}
