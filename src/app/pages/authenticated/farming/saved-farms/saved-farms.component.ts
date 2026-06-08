import { Component, computed, effect, inject, OnInit, signal, untracked, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonComponent } from '@app/shared/components';
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';
import { MapTablePipelineComponent } from '@app/shared/components/map-table-pipeline/map-table-pipeline.component';
import { TabNavComponent } from '@app/shared/components/tab-nav/tab-nav.component';
import { TabNavItem } from '@app/shared/components/tab-nav/tab-nav.types';
import { OlMapComponent } from '@app/shared/components/ol-map/ol-map.component';
import { MAP_DEFAULTS } from '@app/core/config/map.config';
import {
  SAVED_FARM_EMPTY_COPY,
  SAVED_FARMS_DEFAULT_PAGE_SIZE,
  SAVED_FARMS_FILTER_FIELD_OPTIONS,
  SAVED_FARMS_PAGE_SIZE_OPTIONS,
  SavedFarmTabId
} from '@app/core/config/saved-farms.config';
import { AuthService } from '@app/core/services/auth.service';
import { MapTableSyncService } from '@app/core/services/map-table-sync.service';
import { OlMapService, type MapObjectRefs } from '@app/core/services/ol-map.service';
import { SavedFarmsService } from '@app/core/services/saved-farms.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { VerticalService } from '@app/core/services/vertical.service';

@Component({
  selector: 'app-saved-farms',
  standalone: true,
  imports: [
    MapTablePipelineComponent,
    TabNavComponent,
    OlMapComponent,
    DataTableComponent,
    ButtonComponent,
    FormsModule,
    IconField,
    InputIcon,
    InputText,
    Select
  ],
  templateUrl: './saved-farms.component.html'
})
export class SavedFarmsComponent implements OnInit {
  @ViewChild(MapTablePipelineComponent) private mapPipeline?: MapTablePipelineComponent;

  private readonly authService = inject(AuthService);
  private readonly savedFarmsService = inject(SavedFarmsService);
  private readonly verticalService = inject(VerticalService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly mapTableSync = inject(MapTableSyncService);
  private readonly olMapService = inject(OlMapService);

  readonly columns = this.savedFarmsService.columns;
  readonly rows = this.savedFarmsService.rows;
  readonly loading = this.savedFarmsService.loading;
  readonly error = this.savedFarmsService.error;
  readonly totalCount = this.savedFarmsService.totalCount;
  readonly tabs = this.savedFarmsService.tabs;
  readonly tabCounts = this.savedFarmsService.tabCounts;
  readonly activeTab = this.savedFarmsService.activeTab;
  readonly searchText = this.savedFarmsService.searchText;
  readonly searchField = this.savedFarmsService.searchField;
  readonly filterFieldOptions = SAVED_FARMS_FILTER_FIELD_OPTIONS;

  readonly pipelineConfig = { defaultViewMode: 'list' as const };
  readonly pageSize = SAVED_FARMS_DEFAULT_PAGE_SIZE;
  readonly pageSizeOptions = SAVED_FARMS_PAGE_SIZE_OPTIONS;

  readonly emptyTitle = computed(() => SAVED_FARM_EMPTY_COPY[this.activeTab()].title);
  readonly emptyDescription = computed(() => {
    if (this.savedFarmsService.hasActiveFilters()) {
      return 'No farms match your current filters. Try a different search or clear filters.';
    }

    return SAVED_FARM_EMPTY_COPY[this.activeTab()].description;
  });

  readonly tabNavItems = computed((): TabNavItem[] =>
    this.tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      badge: this.tabCounts()[tab.id]
    }))
  );

  readonly hasActiveFilters = computed(() => {
    this.searchText();
    this.searchField();
    return this.savedFarmsService.hasActiveFilters();
  });

  readonly filtersOpen = signal(false);

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

    effect(() => {
      this.verticalService.content();
      untracked(() => this.savedFarmsService.rebucketFarms());
    });
  }

  ngOnInit(): void {
    this.mapObject.resetMapHandler = (refs, setCenterReset) => {
      this.olMapService.clearMap(refs, setCenterReset ?? false);
    };
  }

  onTabChange(tabId: string): void {
    this.onFarmHoverEnd();
    this.savedFarmsService.setActiveTab(tabId as SavedFarmTabId);
  }

  refreshFarms(): void {
    this.savedFarmsService.refresh();
  }

  onSearchInput(event: Event): void {
    this.savedFarmsService.setSearchText((event.target as HTMLInputElement).value);
  }

  onSearchFieldChange(value: string): void {
    this.savedFarmsService.setSearchField(value);
  }

  clearSearch(): void {
    this.savedFarmsService.clearSearch();
  }

  toggleFilters(event: Event): void {
    this.filtersOpen.update((open) => !open);
    (event.currentTarget as HTMLButtonElement).blur();
  }

  onMapResize(): void {
    this.mapTableSync.scheduleMapResize(this.mapObject);
  }

  onFarmHover(row: Record<string, unknown>): void {
    const geometry = row['geometry'];
    if (!geometry) {
      return;
    }

    this.hoverActive = true;
    if (this.mapObject.hovers) {
      this.mapObject.hovers.hoverOnFarm = true;
    }

    this.mapPipeline?.ensureMapVisibleForPreview();
    this.drawFarmGeometryWhenReady(geometry);
  }

  private drawFarmGeometryWhenReady(geometry: unknown, attempt = 0): void {
    if (!this.mapObject.shapesLayer || !this.mapObject.map) {
      if (attempt < 20) {
        setTimeout(() => this.drawFarmGeometryWhenReady(geometry, attempt + 1), 100);
      }
      return;
    }

    this.mapTableSync.showFarmGeometry(this.mapObject, geometry);
    this.mapTableSync.scheduleMapResize(this.mapObject, attempt === 0 ? 220 : 120);
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
