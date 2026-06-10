import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonComponent } from '@app/shared/components';
import { ModalComponent } from '@app/shared/components/modal/modal.component';
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';
import { MapTablePipelineComponent } from '@app/shared/components/map-table-pipeline/map-table-pipeline.component';
import { MapPipelineViewMode } from '@app/shared/components/map-table-pipeline/map-table-pipeline.types';
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
import { LayoutService } from '@app/core/services/layout.service';
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
    ModalComponent,
    FormsModule,
    IconField,
    InputIcon,
    InputText,
    Select
  ],
  templateUrl: './saved-farms.component.html'
})
export class SavedFarmsComponent implements OnInit, OnDestroy {
  @ViewChild('deleteConfirmModal') private deleteConfirmModal?: ModalComponent;

  private readonly authService = inject(AuthService);
  private readonly savedFarmsService = inject(SavedFarmsService);
  private readonly verticalService = inject(VerticalService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly mapTableSync = inject(MapTableSyncService);
  private readonly olMapService = inject(OlMapService);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

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

  readonly pipelineConfig = {
    defaultViewMode: 'list' as const,
    viewModes: ['list', 'both'] as MapPipelineViewMode[]
  };
  readonly pipelineViewMode = signal<MapPipelineViewMode>('list');
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
  readonly selectionMode = signal(false);
  readonly selectedFarmIds = signal<Set<string>>(new Set());
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly pendingDeleteIds = signal<string[]>([]);
  readonly actionNotice = signal<string | null>(null);

  readonly selectedCount = computed(() => this.selectedFarmIds().size);
  readonly hasSelection = computed(() => this.selectedCount() > 0);
  readonly pendingDeleteCount = computed(() => this.pendingDeleteIds().length);
  readonly deleteConfirmTitle = computed(() =>
    this.pendingDeleteCount() === 1 ? 'Delete farm?' : `Delete ${this.pendingDeleteCount()} farms?`
  );

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
  private autoCollapsedNavForSplit = false;

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

  ngOnDestroy(): void {
    this.clearFarmHoverNow();
    if (this.autoCollapsedNavForSplit) {
      this.layoutService.requestSidebarCollapse(false);
    }
  }

  onTabChange(tabId: string): void {
    this.onFarmHoverEnd();
    this.exitSelectionMode();
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

  onPipelineViewModeChange(mode: MapPipelineViewMode): void {
    const previousMode = this.pipelineViewMode();
    this.pipelineViewMode.set(mode);

    if (mode === 'list') {
      this.clearFarmHoverNow();
    }

    if (mode === 'both' && previousMode === 'list') {
      if (!this.layoutService.sidebarCollapsed()) {
        this.layoutService.requestSidebarCollapse(true);
        this.autoCollapsedNavForSplit = true;
      }
    } else if (mode === 'list' && this.autoCollapsedNavForSplit) {
      this.layoutService.requestSidebarCollapse(false);
      this.autoCollapsedNavForSplit = false;
    }

    if (mode === 'both' || previousMode === 'both') {
      setTimeout(() => this.onMapResize(), 220);
    }
  }

  onFarmHover(row: Record<string, unknown>): void {
    const geometry = row['geometry'];
    if (!geometry || this.pipelineViewMode() === 'list') {
      return;
    }

    this.hoverActive = true;
    if (this.mapObject.hovers) {
      this.mapObject.hovers.hoverOnFarm = true;
    }

    this.drawFarmGeometryWhenReady(geometry);
  }

  private drawFarmGeometryWhenReady(geometry: unknown, attempt = 0): void {
    if (!this.mapObject.shapesLayer || !this.mapObject.map) {
      if (attempt < 20) {
        setTimeout(() => this.drawFarmGeometryWhenReady(geometry, attempt + 1), 100);
      }
      return;
    }

    // Legacy onFarmMouseEnter: clear, redraw, instant fit on every row (no animation).
    this.mapTableSync.showFarmGeometry(this.mapObject, geometry, {
      fit: true,
      fitDuration: 0,
      updateInPlace: false
    });
  }

  onFarmHoverEnd(): void {
    this.clearFarmHoverNow();
  }

  private clearFarmHoverNow(): void {
    if (!this.hoverActive) {
      return;
    }

    this.hoverActive = false;
    if (this.mapObject.hovers) {
      this.mapObject.hovers.hoverOnFarm = false;
    }
    this.mapTableSync.clearFarmGeometry(this.mapObject);
  }

  onRowAction(event: { actionId: string; row: Record<string, unknown> }): void {
    const farmId = this.resolveFarmId(event.row);
    if (!farmId) {
      return;
    }

    switch (event.actionId) {
      case 'select':
        this.router.navigate(['/detail/farm', farmId], {
          queryParams: { returnUrl: '/farming/saved-farms' },
          state: {
            title: event.row['name'],
            geometry: event.row['geometry']
          }
        });
        break;
      case 'rename':
        this.showActionNotice('Rename farm will be available in a future update.');
        break;
      case 'delete':
        this.openDeleteConfirm([farmId]);
        break;
      case 'dynamic-stats':
        this.showActionNotice('Dynamic Stats will be available in a future update.');
        break;
    }
  }

  onSelectionChange(event: { rowId: string; selected: boolean }): void {
    this.selectedFarmIds.update((current) => {
      const next = new Set(current);
      if (event.selected) {
        next.add(event.rowId);
      } else {
        next.delete(event.rowId);
      }
      return next;
    });
  }

  onSelectAllChange(event: { rowIds: string[]; selected: boolean }): void {
    this.selectedFarmIds.update((current) => {
      const next = new Set(current);
      event.rowIds.forEach((rowId) => {
        if (event.selected) {
          next.add(rowId);
        } else {
          next.delete(rowId);
        }
      });
      return next;
    });
  }

  enterSelectionMode(): void {
    this.selectionMode.set(true);
    this.selectedFarmIds.set(new Set());
  }

  exitSelectionMode(): void {
    this.selectionMode.set(false);
    this.selectedFarmIds.set(new Set());
  }

  deleteSelectedFarms(): void {
    const ids = [...this.selectedFarmIds()];
    if (!ids.length) {
      return;
    }

    this.openDeleteConfirm(ids);
  }

  openDeleteConfirm(farmIds: string[]): void {
    this.deleteError.set(null);
    this.pendingDeleteIds.set(farmIds);
    this.deleteConfirmModal?.open();
  }

  closeDeleteConfirm(): void {
    this.pendingDeleteIds.set([]);
    this.deleteError.set(null);
    this.deleteConfirmModal?.close();
  }

  confirmDeleteFarms(): void {
    const farmIds = this.pendingDeleteIds();
    if (!farmIds.length || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.savedFarmsService.removeFarms(farmIds).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteConfirm();
        this.exitSelectionMode();
        this.savedFarmsService.refresh();
      },
      error: (err: Error) => {
        this.deleting.set(false);
        this.deleteError.set(err.message ?? 'Failed to delete farm(s).');
      }
    });
  }

  private resolveFarmId(row: Record<string, unknown>): string | null {
    const id = row['farmId'] ?? row['id'];
    return id != null && id !== '' ? String(id) : null;
  }

  private showActionNotice(message: string): void {
    this.actionNotice.set(message);
    setTimeout(() => {
      if (this.actionNotice() === message) {
        this.actionNotice.set(null);
      }
    }, 4000);
  }
}
