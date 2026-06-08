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
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonComponent } from '@app/shared/components';
import { ModalComponent } from '@app/shared/components/modal/modal.component';
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';
import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';
import { MapTablePipelineComponent } from '@app/shared/components/map-table-pipeline/map-table-pipeline.component';
import { MapPipelineViewMode } from '@app/shared/components/map-table-pipeline/map-table-pipeline.types';
import { OlMapComponent } from '@app/shared/components/ol-map/ol-map.component';
import {
  DETAIL_PAGE_DEFAULT_PAGE_SIZE,
  DETAIL_PAGE_EMPTY_COPY,
  DETAIL_PAGE_SIZE_OPTIONS,
  DETAIL_SEARCH_FIELD_OPTIONS
} from '@app/core/config/detail-page.config';
import { MAP_DEFAULTS } from '@app/core/config/map.config';
import { DetailPageRouterState } from '@app/core/interfaces/property-record.interface';
import { DetailPageService } from '@app/core/services/detail-page.service';
import { LayoutService } from '@app/core/services/layout.service';
import { MapTableSyncService } from '@app/core/services/map-table-sync.service';
import { OlMapService, type MapObjectRefs } from '@app/core/services/ol-map.service';

const DETAIL_ACTIONS_COLUMN: DataTableColumn = {
  key: 'actions',
  label: '',
  variant: 'actions',
  sortable: false,
  align: 'center',
  width: 'w-20 min-w-[5.5rem]'
};

@Component({
  selector: 'app-detail-page',
  standalone: true,
  imports: [
    MapTablePipelineComponent,
    OlMapComponent,
    DataTableComponent,
    ButtonComponent,
    ModalComponent,
    FormsModule,
    Select,
    IconField,
    InputIcon,
    InputText
  ],
  templateUrl: './detail-page.component.html'
})
export class DetailPageComponent implements OnInit, OnDestroy {
  @ViewChild('deleteConfirmModal') private deleteConfirmModal?: ModalComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly detailPageService = inject(DetailPageService);
  private readonly mapTableSync = inject(MapTableSyncService);
  private readonly olMapService = inject(OlMapService);
  private readonly layoutService = inject(LayoutService);

  readonly rows = this.detailPageService.rows;
  readonly loading = this.detailPageService.loading;
  readonly error = this.detailPageService.error;
  readonly title = this.detailPageService.title;
  readonly titleLabel = this.detailPageService.titleLabel;
  readonly showFilter = this.detailPageService.showFilter;
  readonly filterOptions = this.detailPageService.filterOptions;
  readonly activeFilter = this.detailPageService.activeFilter;
  readonly supportsDelete = this.detailPageService.supportsDelete;
  readonly searchText = this.detailPageService.searchText;
  readonly searchField = this.detailPageService.searchField;
  readonly searchFieldOptions = DETAIL_SEARCH_FIELD_OPTIONS;

  readonly displayColumns = computed(() => [DETAIL_ACTIONS_COLUMN, ...this.detailPageService.columns()]);

  readonly hasActiveFilters = computed(() => {
    this.searchText();
    this.searchField();
    return this.detailPageService.hasActiveClientFilters();
  });

  readonly emptyTitle = computed(() => DETAIL_PAGE_EMPTY_COPY.title);
  readonly emptyDescription = computed(() =>
    this.hasActiveFilters()
      ? DETAIL_PAGE_EMPTY_COPY.filteredDescription
      : DETAIL_PAGE_EMPTY_COPY.description
  );

  readonly pipelineConfig = {
    defaultViewMode: 'both' as const,
    viewModes: ['map', 'list', 'both'] as MapPipelineViewMode[]
  };

  readonly pageSize = DETAIL_PAGE_DEFAULT_PAGE_SIZE;
  readonly pageSizeOptions = DETAIL_PAGE_SIZE_OPTIONS;

  readonly filtersOpen = signal(false);
  readonly selectionMode = signal(false);
  readonly selectedPropertyIds = signal<Set<string>>(new Set());
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly selectedCount = computed(() => this.selectedPropertyIds().size);
  readonly hasSelection = computed(() => this.selectedCount() > 0);
  readonly deleteConfirmTitle = computed(() =>
    this.selectedCount() === 1 ? 'Exclude property?' : `Exclude ${this.selectedCount()} properties?`
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

  private pipelineViewMode: MapPipelineViewMode = 'both';
  private autoCollapsedNavForSplit = false;

  constructor() {
    effect(() => {
      const geometry = this.detailPageService.geometry();
      const rows = this.detailPageService.rows();
      const loading = this.detailPageService.loading();

      if (loading || this.pipelineViewMode === 'list') {
        return;
      }

      untracked(() => {
        if (!rows.length && !geometry) {
          return;
        }

        this.renderMapWhenReady(geometry, rows);
      });
    });
  }

  ngOnInit(): void {
    this.mapObject.resetMapHandler = (refs, setCenterReset) => {
      this.olMapService.clearMap(refs, setCenterReset ?? false);
    };

    const source = this.route.snapshot.paramMap.get('source') ?? '';
    const sourceId = this.route.snapshot.paramMap.get('sourceId') ?? '';
    const routerState = (this.location.getState() as DetailPageRouterState | null) ?? undefined;

    this.detailPageService.init(source, sourceId, {
      title: routerState?.title,
      geometry: routerState?.geometry
    });
  }

  ngOnDestroy(): void {
    this.detailPageService.destroy();
    if (this.autoCollapsedNavForSplit) {
      this.layoutService.requestSidebarCollapse(false);
    }
  }

  onMapResize(): void {
    this.mapTableSync.scheduleMapResize(this.mapObject);
  }

  onPipelineViewModeChange(mode: MapPipelineViewMode): void {
    const previousMode = this.pipelineViewMode;
    this.pipelineViewMode = mode;

    if (mode === 'both' && previousMode === 'list') {
      if (!this.layoutService.sidebarCollapsed()) {
        this.layoutService.requestSidebarCollapse(true);
        this.autoCollapsedNavForSplit = true;
      }
    } else if (mode === 'list' && this.autoCollapsedNavForSplit) {
      this.layoutService.requestSidebarCollapse(false);
      this.autoCollapsedNavForSplit = false;
    }

    if (mode !== 'list' && (mode === 'both' || previousMode === 'both' || mode === 'map')) {
      const geometry = this.detailPageService.geometry();
      const rows = this.detailPageService.rows();
      setTimeout(() => {
        this.renderMapWhenReady(geometry, rows);
        this.onMapResize();
      }, 220);
    }

    if (mode === 'list') {
      this.mapTableSync.clearContextGeometry(this.mapObject);
      this.mapTableSync.clearPropertyMarkers(this.mapObject);
    }
  }

  onListFilterChange(filter: string): void {
    this.exitSelectionMode();
    this.detailPageService.setFilter(filter);
  }

  refreshDetail(): void {
    this.detailPageService.refresh();
  }

  toggleFilters(event: Event): void {
    this.filtersOpen.update((open) => !open);
    (event.currentTarget as HTMLButtonElement).blur();
  }

  onSearchInput(event: Event): void {
    this.detailPageService.setSearchText((event.target as HTMLInputElement).value);
  }

  onSearchFieldChange(value: string): void {
    this.detailPageService.setSearchField(value);
  }

  clearSearch(): void {
    this.detailPageService.clearSearch();
  }

  enterSelectionMode(): void {
    if (!this.supportsDelete()) {
      return;
    }

    this.selectionMode.set(true);
    this.selectedPropertyIds.set(new Set());
  }

  exitSelectionMode(): void {
    this.selectionMode.set(false);
    this.selectedPropertyIds.set(new Set());
  }

  onSelectionChange(event: { rowId: string; selected: boolean }): void {
    this.selectedPropertyIds.update((current) => {
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
    this.selectedPropertyIds.update((current) => {
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

  openDeleteConfirm(): void {
    const ids = [...this.selectedPropertyIds()];
    if (!ids.length) {
      return;
    }

    this.deleteError.set(null);
    this.deleteConfirmModal?.open();
  }

  closeDeleteConfirm(): void {
    this.deleteError.set(null);
    this.deleteConfirmModal?.close();
  }

  confirmDeleteProperties(): void {
    const ids = [...this.selectedPropertyIds()];
    if (!ids.length || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.detailPageService.excludeSelected(ids).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteConfirm();
        this.exitSelectionMode();
      },
      error: (err: Error) => {
        this.deleting.set(false);
        this.deleteError.set(err.message ?? 'Failed to exclude selected properties.');
      }
    });
  }

  onRowAction(_event: { actionId: string; row: Record<string, unknown> }): void {}

  onPropertyNotesClick(_event: { row: Record<string, unknown> }): void {}

  goBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.location.back();
  }

  private renderMapWhenReady(
    geometry: unknown,
    rows: Record<string, unknown>[],
    attempt = 0
  ): void {
    if (!this.mapObject.shapesLayer || !this.mapObject.map || !this.mapObject.vectorLayer) {
      if (attempt < 25) {
        setTimeout(() => this.renderMapWhenReady(geometry, rows, attempt + 1), 100);
      }
      return;
    }

    this.mapTableSync.renderDetailMap(this.mapObject, geometry, rows);
  }
}
