import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
  viewChild,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Select } from 'primeng/select';
import {
  buildDetailExportMenuItems,
  buildDetailOverflowMenuItems,
  DETAIL_FARM_OVERFLOW_MENU_ACTIONS,
  DetailExportActionId,
  DetailToolbarActionId
} from '@app/core/config/detail-page-toolbar.config';
import {
  buildQueryOverflowMenuItems,
  buildQuerySaveShareMenuItems,
  QueryOverflowActionId,
  QuerySaveShareActionId
} from '@app/core/config/detail-page-query-toolbar.config';
import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchService } from '@app/core/services/area-search.service';
import { AlertComponent, ButtonComponent } from '@app/shared/components';
import { ModalComponent } from '@app/shared/components/modal/modal.component';
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';
import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';
import { MapTablePipelineComponent } from '@app/shared/components/map-table-pipeline/map-table-pipeline.component';
import { MapPipelineViewMode } from '@app/shared/components/map-table-pipeline/map-table-pipeline.types';
import { OlMapComponent } from '@app/shared/components/ol-map/ol-map.component';
import { AreaSearchCriteriaChipsComponent } from '@app/shared/components/area-search-fields/area-search-criteria-chips.component';
import {
  DETAIL_PAGE_DEFAULT_PAGE_SIZE,
  DETAIL_PAGE_EMPTY_COPY,
  DETAIL_PAGE_SIZE_OPTIONS,
  DETAIL_SEARCH_FIELD_OPTIONS,
  STATISTICS_DETAIL_COLUMNS,
  STATISTICS_DETAIL_EMPTY_COPY,
  STATISTICS_SEARCH_FIELD_OPTIONS,
  isSellRefiScoresPending,
  shouldHideSellRefiScoresMenuAction
} from '@app/core/config/detail-page.config';
import { MAP_DEFAULTS } from '@app/core/config/map.config';
import { DetailPageRouterState } from '@app/core/interfaces/property-record.interface';
import { AreaSearchSessionService } from '@app/core/services/area-search-session.service';
import { AreaSearchStateService } from '@app/core/services/area-search-state.service';
import { DetailPageService } from '@app/core/services/detail-page.service';
import { LayoutService } from '@app/core/services/layout.service';
import { MapTableSyncService } from '@app/core/services/map-table-sync.service';
import { OlMapService, type MapObjectRefs } from '@app/core/services/ol-map.service';
import { StatsAreaSearchStateService } from '@app/core/services/stats-area-search-state.service';
import { StatisticsSessionService } from '@app/core/services/statistics-session.service';
import { ClearSearchService } from '@app/core/services/clear-search.service';
import { ClearSearchStateService } from '@app/core/services/clear-search-state.service';
import type { DetailSource } from '@app/core/services/clear-search-state.service';
import { downloadCsv } from '@app/core/utils/csv-download.util';

const DETAIL_ACTIONS_COLUMN: DataTableColumn = {
  key: 'actions',
  label: '',
  variant: 'actions',
  sortable: false,
  align: 'center',
  width: 'w-20 min-w-22'
};

@Component({
  selector: 'app-detail-page',
  standalone: true,
  imports: [
    MapTablePipelineComponent,
    OlMapComponent,
    DataTableComponent,
    AlertComponent,
    ButtonComponent,
    ModalComponent,
    FormsModule,
    Select,
    Menu,
    IconField,
    InputIcon,
    InputText,
    AreaSearchCriteriaChipsComponent
  ],
  templateUrl: './detail-page.component.html',
  styles: [
    `
      :host .detail-toolbar .detail-toolbar-select {
        height: 2.25rem;
        min-height: 2.25rem;
      }

      :host .detail-toolbar .detail-toolbar-select .p-select-label {
        display: flex;
        min-height: 2.25rem;
        align-items: center;
        padding-top: 0;
        padding-bottom: 0;
      }
    `
  ]
})
export class DetailPageComponent implements OnInit, OnDestroy {
  readonly toolbarBtnClass =
    'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-transparent px-3 text-sm font-medium text-muted transition-colors hover:bg-primary/10 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-40';

  readonly toolbarBtnPrimaryClass =
    'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-40';

  readonly toolbarBtnIconClass =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-transparent text-muted transition-colors hover:bg-sidebar-active hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-40';

  @ViewChild('deleteConfirmModal') private deleteConfirmModal?: ModalComponent;
  @ViewChild('saveSearchModal') private saveSearchModal?: ModalComponent;
  @ViewChild('shareSearchModal') private shareSearchModal?: ModalComponent;
  @ViewChild('sendDataModal') private sendDataModal?: ModalComponent;
  readonly exportMenu = viewChild<Menu>('exportMenu');
  readonly saveShareMenu = viewChild<Menu>('saveShareMenu');
  readonly overflowMenu = viewChild<Menu>('overflowMenu');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly detailPageService = inject(DetailPageService);
  private readonly areaSearchSessionService = inject(AreaSearchSessionService);
  private readonly areaSearchStateService = inject(AreaSearchStateService);
  private readonly areaSearchService = inject(AreaSearchService);
  private readonly mapTableSync = inject(MapTableSyncService);
  private readonly olMapService = inject(OlMapService);
  private readonly layoutService = inject(LayoutService);
  private readonly statisticsSessionService = inject(StatisticsSessionService);
  private readonly statsAreaSearchStateService = inject(StatsAreaSearchStateService);
  private readonly clearSearchService = inject(ClearSearchService);
  private readonly clearSearchState = inject(ClearSearchStateService);

  readonly rows = this.detailPageService.rows;
  readonly loading = this.detailPageService.loading;
  readonly error = this.detailPageService.error;
  readonly title = this.detailPageService.title;
  readonly titleLabel = this.detailPageService.titleLabel;
  readonly criteriaChips = this.detailPageService.criteriaChips;
  readonly showFilter = this.detailPageService.showFilter;
  readonly filterOptions = this.detailPageService.filterOptions;
  readonly activeFilter = this.detailPageService.activeFilter;
  readonly bulkSelectionMode = this.detailPageService.bulkSelectionMode;
  readonly supportsBulkSelection = computed(() => !!this.bulkSelectionMode());
  readonly searchText = this.detailPageService.searchText;
  readonly searchField = this.detailPageService.searchField;
  readonly searchFieldOptions = computed(() =>
    this.isStatisticsDetail() ? STATISTICS_SEARCH_FIELD_OPTIONS : DETAIL_SEARCH_FIELD_OPTIONS
  );

  readonly isFarmDetail = computed(() => this.detailPageService.source() === 'farm');
  readonly isQueryDetail = computed(() => this.detailPageService.source() === 'query');
  readonly isStatisticsDetail = computed(() => this.detailPageService.source() === 'statistics');
  readonly toolbarDisabled = computed(() => this.loading() || this.selectionMode());
  readonly exportMenuItems = computed(() =>
    buildDetailExportMenuItems((actionId) => this.onExportAction(actionId))
  );
  readonly saveShareMenuItems = computed(() =>
    buildQuerySaveShareMenuItems((actionId) => this.onQuerySaveShareAction(actionId))
  );
  readonly overflowMenuItems = computed(() => {
    if (this.isQueryDetail()) {
      return buildQueryOverflowMenuItems((actionId) => this.onQueryOverflowAction(actionId));
    }

    if (!this.isFarmDetail()) {
      return [];
    }

    const hideSellRefiScores = shouldHideSellRefiScoresMenuAction(this.detailPageService.allRows());
    const actions = DETAIL_FARM_OVERFLOW_MENU_ACTIONS.filter(
      (action) => action.id !== 'sell-refi-scores' || !hideSellRefiScores
    );

    return buildDetailOverflowMenuItems(actions, (actionId) => this.onFarmOverflowAction(actionId));
  });

  readonly sellRefiScoresPending = computed(() =>
    this.isFarmDetail() && isSellRefiScoresPending(this.detailPageService.allRows())
  );

  readonly displayColumns = computed(() => [DETAIL_ACTIONS_COLUMN, ...this.detailPageService.columns()]);

  readonly hasActiveFilters = computed(() => {
    this.searchText();
    this.searchField();
    return this.detailPageService.hasActiveClientFilters();
  });

  readonly emptyTitle = computed(() =>
    this.isStatisticsDetail() ? STATISTICS_DETAIL_EMPTY_COPY.title : DETAIL_PAGE_EMPTY_COPY.title
  );
  readonly emptyDescription = computed(() => {
    const copy = this.isStatisticsDetail() ? STATISTICS_DETAIL_EMPTY_COPY : DETAIL_PAGE_EMPTY_COPY;
    return this.hasActiveFilters() ? copy.filteredDescription : copy.description;
  });

  readonly pipelineConfig = {
    defaultViewMode: 'both' as const,
    viewModes: ['map', 'list', 'both'] as MapPipelineViewMode[]
  };

  readonly pageSize = DETAIL_PAGE_DEFAULT_PAGE_SIZE;
  readonly pageSizeOptions = DETAIL_PAGE_SIZE_OPTIONS;

  readonly filtersOpen = signal(false);
  readonly actionNotice = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly saveName = signal('');
  readonly shareEmail = signal('');
  readonly sendDataEmail = signal('');
  readonly queryActionLoading = signal(false);
  readonly selectionMode = signal(false);
  readonly selectedPropertyIds = signal<Set<string>>(new Set());
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly selectedCount = computed(() => this.selectedPropertyIds().size);
  readonly hasSelection = computed(() => this.selectedCount() > 0);
  readonly deleteConfirmTitle = computed(() => {
    if (this.isStatisticsDetail()) {
      return this.selectedCount() === 1 ? 'Exclude tract?' : `Exclude ${this.selectedCount()} tracts?`;
    }

    return this.selectedCount() === 1 ? 'Exclude property?' : `Exclude ${this.selectedCount()} properties?`;
  });

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

    effect(() => {
      const source = this.detailPageService.source();
      const rows = this.detailPageService.rows();
      const sessionId = this.detailPageService.sourceId();
      const detailSource: DetailSource | null =
        source === 'query' ? 'query' : source === 'statistics' ? 'statistics' : null;
      const active = !!detailSource && rows.length > 0;

      this.clearSearchState.setDetailResultsActive(
        active,
        detailSource,
        sessionId || null,
        rows.length > 0
      );
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
    this.clearSearchState.setDetailResultsActive(false);
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
    if (!this.supportsBulkSelection()) {
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
        this.showActionNotice(
          this.isStatisticsDetail()
            ? 'Selected tracts excluded from results.'
            : 'Selected properties excluded from results.'
        );
      },
      error: (err: Error) => {
        this.deleting.set(false);
        this.deleteError.set(err.message ?? 'Failed to exclude selected records.');
      }
    });
  }

  excludeSelectedRecords(): void {
    this.applyQueryBulkSelection('exclude');
  }

  includeSelectedRecords(): void {
    this.applyQueryBulkSelection('include');
  }

  private applyQueryBulkSelection(action: 'exclude' | 'include'): void {
    const ids = [...this.selectedPropertyIds()];
    if (!ids.length || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.actionError.set(null);

    const request =
      action === 'exclude'
        ? this.detailPageService.excludeSelected(ids)
        : this.detailPageService.includeSelected(ids);

    request.subscribe({
      next: () => {
        this.deleting.set(false);
        this.exitSelectionMode();
        this.showActionNotice(
          action === 'exclude'
            ? 'Selected properties excluded from results.'
            : 'Selected properties included in results.'
        );
      },
      error: (err: Error) => {
        this.deleting.set(false);
        this.actionError.set(
          err.message ??
            (action === 'exclude'
              ? 'Failed to exclude selected properties.'
              : 'Failed to include selected properties.')
        );
      }
    });
  }

  onRowAction(_event: { actionId: string; row: Record<string, unknown> }): void {}

  onPropertyNotesClick(_event: { row: Record<string, unknown> }): void {}

  toggleExportMenu(event: Event): void {
    this.exportMenu()?.toggle(event);
    (event.currentTarget as HTMLButtonElement).blur();
  }

  toggleSaveShareMenu(event: Event): void {
    this.saveShareMenu()?.toggle(event);
    (event.currentTarget as HTMLButtonElement).blur();
  }

  toggleOverflowMenu(event: Event): void {
    this.overflowMenu()?.toggle(event);
    (event.currentTarget as HTMLButtonElement).blur();
  }

  onExportAction(_actionId: DetailExportActionId): void {
    this.showActionNotice('This export option will be available in a future update.');
  }

  exportStatisticsCsv(): void {
    const rows = this.detailPageService.allRows();
    if (!rows.length) {
      this.showActionNotice('No records to export.');
      return;
    }

    const headers = STATISTICS_DETAIL_COLUMNS.map((column) => column.label);
    const dataRows = rows.map((row) =>
      STATISTICS_DETAIL_COLUMNS.map((column) => String(row[column.key] ?? ''))
    );
    const date = new Date().toISOString().slice(0, 10);

    downloadCsv(`statistics-${date}.csv`, headers, dataRows);
  }

  editStatisticsSearch(): void {
    const sessionId = this.detailPageService.sourceId();
    if (!sessionId) {
      return;
    }

    const session = this.statisticsSessionService.getSession(sessionId);
    if (!session) {
      this.actionError.set('Statistics session expired. Please run Statistics Area Search again.');
      return;
    }

    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ?? session.returnUrl ?? '/statistics/radius-search';
    const groupType = session.info.groupType === 'sa_site_zip' ? 'sa_site_zip' : 'sa_site_city';

    this.statsAreaSearchStateService.setEditCriteria(session.payload, groupType, {
      geometry: session.geometry ?? session.info.geometry,
      returnUrl
    });

    void this.router.navigate(['/statistics/area-search'], {
      queryParams: { edit: 'true', returnUrl }
    });
  }

  onQueryOverflowAction(actionId: QueryOverflowActionId): void {
    switch (actionId) {
      case 'save-farm':
        this.saveFarmFromQuery();
        break;
      case 'send-data':
        this.openSendDataModal();
        break;
      case 'edit-search':
        this.editSearch();
        break;
      case 'dynamic-stats':
        this.openDynamicStats();
        break;
      case 'clear-start-over':
        this.clearStartOver();
        break;
      case 'new-possible-leads':
        this.openNewPossibleLeads();
        break;
    }
  }

  onFarmOverflowAction(actionId: DetailToolbarActionId): void {
    switch (actionId) {
      case 'send-data':
        this.showActionNotice('Send Data will be available in a future update.');
        break;
      case 'dynamic-stats':
        this.showActionNotice('Dynamic Stats will be available in a future update.');
        break;
      case 'new-possible-leads':
        this.showActionNotice('New Possible Leads will be available in a future update.');
        break;
      case 'sell-refi-scores':
        this.showActionNotice('Sell & Refi Scores will be available in a future update.');
        break;
      default:
        this.showActionNotice('This action will be available in a future update.');
    }
  }

  onQuerySaveShareAction(actionId: QuerySaveShareActionId): void {
    if (actionId === 'save-search') {
      this.openSaveSearchModal();
      return;
    }

    this.openShareSearchModal();
  }

  openSaveSearchModal(): void {
    const session = this.getQuerySession();
    this.actionError.set(null);
    this.saveName.set(session?.title && session.title !== 'Area Search Results' ? session.title : '');
    this.saveSearchModal?.open();
  }

  closeSaveSearchModal(): void {
    this.saveSearchModal?.close();
  }

  confirmSaveSearch(): void {
    const name = this.saveName().trim();
    const payload = this.getQueryPayload();
    if (!name || !payload) {
      return;
    }

    const session = this.getQuerySession();
    this.queryActionLoading.set(true);
    this.actionError.set(null);

    this.areaSearchService
      .saveQuery({
        name,
        query: payload,
        is_to_update: !!session?.queryId,
        query_id: session?.queryId
      })
      .subscribe({
        next: () => {
          this.queryActionLoading.set(false);
          this.closeSaveSearchModal();
          this.areaSearchStateService.setQueryMeta(
            session?.queryId != null ? String(session.queryId) : null,
            name
          );
          this.showActionNotice('Search saved successfully.');
        },
        error: (err: Error) => {
          this.queryActionLoading.set(false);
          this.actionError.set(err.message ?? 'Failed to save search.');
        }
      });
  }

  openShareSearchModal(): void {
    this.actionError.set(null);
    this.shareEmail.set('');
    this.shareSearchModal?.open();
  }

  closeShareSearchModal(): void {
    this.shareSearchModal?.close();
  }

  confirmShareSearch(): void {
    const email = this.shareEmail().trim();
    const payload = this.getQueryPayload();
    if (!email || !payload) {
      return;
    }

    this.queryActionLoading.set(true);
    this.actionError.set(null);

    this.areaSearchService
      .shareQuery({
        shared_to_email: email,
        query: payload,
        name: this.saveName().trim() || this.getQuerySession()?.title || 'Shared Search'
      })
      .subscribe({
        next: () => {
          this.queryActionLoading.set(false);
          this.closeShareSearchModal();
          this.showActionNotice('Search shared successfully.');
        },
        error: (err: Error) => {
          this.queryActionLoading.set(false);
          this.actionError.set(err.message ?? 'Failed to share search.');
        }
      });
  }

  openSendDataModal(): void {
    this.actionError.set(null);
    this.sendDataEmail.set('');
    this.sendDataModal?.open();
  }

  closeSendDataModal(): void {
    this.sendDataModal?.close();
  }

  confirmSendData(): void {
    const email = this.sendDataEmail().trim();
    const payload = this.getQueryPayload();
    if (!email || !payload) {
      return;
    }

    this.queryActionLoading.set(true);
    this.actionError.set(null);

    this.areaSearchService.sendData({ shared_to_email: email, query: payload }).subscribe({
      next: () => {
        this.queryActionLoading.set(false);
        this.closeSendDataModal();
        this.showActionNotice('Data sent successfully.');
      },
      error: (err: Error) => {
        this.queryActionLoading.set(false);
        this.actionError.set(err.message ?? 'Failed to send data.');
      }
    });
  }

  saveFarmFromQuery(): void {
    this.showActionNotice('Save Farm will be available in a future update.');
  }

  openDynamicStats(): void {
    this.showActionNotice('Dynamic Stats will be available in a future update.');
  }

  openNewPossibleLeads(): void {
    this.showActionNotice('New Possible Leads will be available in a future update.');
  }

  clearStartOver(): void {
    const sessionId = this.detailPageService.sourceId();
    this.queryActionLoading.set(true);
    this.actionError.set(null);

    this.clearSearchService.clearQueryDetail(sessionId || null).subscribe({
      next: () => {
        this.queryActionLoading.set(false);
      },
      error: (err: Error) => {
        this.queryActionLoading.set(false);
        this.actionError.set(err.message ?? 'Failed to clear search.');
      }
    });
  }

  editSearch(): void {
    const sessionId = this.detailPageService.sourceId();
    if (!sessionId) {
      return;
    }

    const session = this.areaSearchSessionService.getSession(sessionId);
    if (!session) {
      return;
    }

    this.areaSearchStateService.setEditCriteria(session.criteria);
    void this.router.navigate(['/farming/area-search'], { queryParams: { edit: 'true' } });
  }

  goBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.location.back();
  }

  private getQuerySession() {
    const sessionId = this.detailPageService.sourceId();
    if (!sessionId) {
      return undefined;
    }

    return this.areaSearchSessionService.getSession(sessionId);
  }

  private getQueryPayload(): AreaSearchPayload | undefined {
    return this.getQuerySession()?.criteria;
  }

  private showActionNotice(message: string): void {
    this.actionNotice.set(message);
    setTimeout(() => {
      if (this.actionNotice() === message) {
        this.actionNotice.set(null);
      }
    }, 4000);
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
