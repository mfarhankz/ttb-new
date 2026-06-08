import { Component, effect, inject, OnInit, untracked } from '@angular/core';
import { ButtonComponent } from '@app/shared/components';
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';
import { MapTablePipelineComponent } from '@app/shared/components/map-table-pipeline/map-table-pipeline.component';
import { OlMapComponent } from '@app/shared/components/ol-map/ol-map.component';
import { MAP_DEFAULTS } from '@app/core/config/map.config';
import { AuthService } from '@app/core/services/auth.service';
import { MapTableSyncService } from '@app/core/services/map-table-sync.service';
import { OlMapService, type MapObjectRefs } from '@app/core/services/ol-map.service';
import { SavedFarmsService } from '@app/core/services/saved-farms.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';

@Component({
  selector: 'app-saved-farms',
  standalone: true,
  imports: [MapTablePipelineComponent, OlMapComponent, DataTableComponent, ButtonComponent],
  templateUrl: './saved-farms.component.html'
})
export class SavedFarmsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly savedFarmsService = inject(SavedFarmsService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly mapTableSync = inject(MapTableSyncService);
  private readonly olMapService = inject(OlMapService);

  readonly columns = this.savedFarmsService.columns;
  readonly rows = this.savedFarmsService.rows;
  readonly loading = this.savedFarmsService.loading;
  readonly error = this.savedFarmsService.error;
  readonly totalCount = this.savedFarmsService.totalCount;

  readonly pipelineConfig = { defaultViewMode: 'list' as const };

  mapObject: MapObjectRefs = {
    hovers: { hoverOnFarm: false }
  };

  mapOptions = {
    lonLat: MAP_DEFAULTS.lonLat,
    zoom: MAP_DEFAULTS.zoom,
    calculateHeight: false,
    listenResize: true
  };

  private hoverActive = false;

  constructor() {
    effect(() => {
      if (this.authService.getUserId() != null) {
        this.sessionExpiredService.sessionRenewed();
        untracked(() => this.savedFarmsService.fetchFarmsList());
      }
    });
  }

  ngOnInit(): void {
    this.mapObject.resetMapHandler = (refs, setCenterReset) => {
      this.olMapService.clearMap(refs, setCenterReset ?? false);
    };
  }

  refreshFarms(): void {
    this.savedFarmsService.refresh();
  }

  onMapResize(): void {
    this.mapTableSync.scheduleMapResize(this.mapObject);
  }

  onFarmHover(row: Record<string, unknown>): void {
    const geometry = row['geometry'];
    if (!geometry || !this.mapObject.map) {
      return;
    }

    this.hoverActive = true;
    if (this.mapObject.hovers) {
      this.mapObject.hovers.hoverOnFarm = true;
    }

    this.mapTableSync.showFarmGeometry(this.mapObject, geometry);
  }

  onFarmHoverEnd(): void {
    if (!this.hoverActive) {
      return;
    }

    this.hoverActive = false;
    if (this.mapObject.hovers) {
      this.mapObject.hovers.hoverOnFarm = false;
    }

    this.mapTableSync.clearFarmGeometry(this.mapObject);
  }
}
