import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DetailContext, DetailContextInitState } from '@app/authenticated/detail/contexts/detail-context.interface';
import {
  FarmDetailContext,
  isUnsupportedDetailSource
} from '@app/authenticated/detail/contexts/farm-detail.context';
import {
  QueryDetailContext,
  isQuerySessionExpiredError
} from '@app/authenticated/detail/contexts/query-detail.context';
import { SearchDetailContext } from '@app/authenticated/detail/contexts/search-detail.context';
import {
  DETAIL_PAGE_DEFAULT_FILTER,
  STATISTICS_DETAIL_COLUMNS,
  resolveVisibleDetailColumns
} from '@app/authenticated/detail/config/detail-page.config';
import { StatisticsDetailContext, isStatisticsSessionExpiredError } from '@app/authenticated/detail/contexts/statistics-detail.context';
import { SavedFarmGeometry } from '@app/core/interfaces/saved-farm.interface';
import { AreaSearchCriteriaChip } from '@app/core/utils/area-search-criteria.util';

const SEARCH_DEBOUNCE_MS = 320;

@Injectable({ providedIn: 'root' })
export class DetailPageService {
  private readonly farmDetailContext = inject(FarmDetailContext);
  private readonly searchDetailContext = inject(SearchDetailContext);
  private readonly queryDetailContext = inject(QueryDetailContext);
  private readonly statisticsDetailContext = inject(StatisticsDetailContext);
  private readonly router = inject(Router);

  private readonly _source = signal<string | null>(null);
  private readonly _sourceId = signal<string | null>(null);
  private readonly _initState = signal<DetailContextInitState | undefined>(undefined);

  private readonly _title = signal('');
  private readonly _titleLabel = signal('Selected');
  private readonly _geometry = signal<SavedFarmGeometry | SavedFarmGeometry[] | undefined>(undefined);
  private readonly _allRows = signal<Record<string, unknown>[]>([]);
  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalCount = signal(0);
  private readonly _activeFilter = signal(DETAIL_PAGE_DEFAULT_FILTER);
  private readonly _showFilter = signal(false);
  private readonly _filterOptions = signal<{ value: string; label: string }[]>([]);
  private readonly _bulkSelectionMode = signal<'farm-exclude' | 'query-include-exclude' | null>(null);
  private readonly _leadsTypes = signal<string[]>([]);
  private readonly _searchText = signal('');
  private readonly _searchField = signal('$');
  private readonly _criteriaChips = signal<AreaSearchCriteriaChip[]>([]);

  readonly source = this._source.asReadonly();
  readonly sourceId = this._sourceId.asReadonly();
  readonly title = this._title.asReadonly();
  readonly titleLabel = this._titleLabel.asReadonly();
  readonly geometry = this._geometry.asReadonly();
  readonly allRows = this._allRows.asReadonly();
  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly activeFilter = this._activeFilter.asReadonly();
  readonly showFilter = this._showFilter.asReadonly();
  readonly filterOptions = this._filterOptions.asReadonly();
  readonly bulkSelectionMode = this._bulkSelectionMode.asReadonly();
  readonly searchText = this._searchText.asReadonly();
  readonly searchField = this._searchField.asReadonly();
  readonly criteriaChips = this._criteriaChips.asReadonly();

  readonly columns = computed(() => {
    if (this._source() === 'statistics') {
      return STATISTICS_DETAIL_COLUMNS;
    }

    return resolveVisibleDetailColumns(this._allRows(), this._leadsTypes());
  });

  private searchDebounce?: ReturnType<typeof setTimeout>;

  hasActiveClientFilters(): boolean {
    return !!this._searchText().trim() || this._searchField() !== '$';
  }

  init(source: string, sourceId: string, initState?: DetailContextInitState): void {
    this._source.set(source);
    this._sourceId.set(sourceId);
    this._initState.set(initState);
    this._searchText.set('');
    this._searchField.set('$');
    this._criteriaChips.set([]);

    if (isUnsupportedDetailSource(source)) {
      this._error.set(`Detail source "${source}" is not supported yet.`);
      this._allRows.set([]);
      this._rows.set([]);
      this._totalCount.set(0);
      return;
    }

    this._activeFilter.set(DETAIL_PAGE_DEFAULT_FILTER);
    this._loading.set(true);
    this._error.set(null);

    const context = this.resolveContext(source);
    context.load(sourceId, initState).subscribe({
      next: (result) => this.applyLoadResult(result),
      error: (err: Error) => {
        this.handleLoadError(source, err, 'Failed to load detail records.');
      }
    });
  }

  refresh(): void {
    const source = this._source();
    const sourceId = this._sourceId();
    if (!source || !sourceId || isUnsupportedDetailSource(source)) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const context = this.resolveContext(source);
    context.refresh(sourceId, this._activeFilter(), this._initState()).subscribe({
      next: (result) => this.applyLoadResult(result),
      error: (err: Error) => {
        this.handleLoadError(source, err, 'Failed to refresh detail records.');
      }
    });
  }

  setFilter(filter: string): void {
    const source = this._source();
    const sourceId = this._sourceId();
    if (!source || !sourceId || isUnsupportedDetailSource(source)) {
      return;
    }

    this._activeFilter.set(filter);
    this._loading.set(true);
    this._error.set(null);

    const context = this.resolveContext(source);
    context.setFilter(sourceId, filter, this._initState()).subscribe({
      next: (result) => this.applyLoadResult(result),
      error: (err: Error) => {
        this.handleLoadError(source, err, 'Failed to load filtered records.');
      }
    });
  }

  setSearchText(value: string): void {
    this._searchText.set(value);
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => this.refreshFilteredRows(), SEARCH_DEBOUNCE_MS);
  }

  setSearchField(value: string): void {
    this._searchField.set(value);
    this.refreshFilteredRows();
  }

  clearSearch(): void {
    this._searchText.set('');
    this.refreshFilteredRows();
  }

  excludeSelected(propertyIds: string[]): Observable<void> {
    return this.applyBulkSelection('exclude', propertyIds);
  }

  includeSelected(propertyIds: string[]): Observable<void> {
    return this.applyBulkSelection('include', propertyIds);
  }

  private applyBulkSelection(
    action: 'exclude' | 'include',
    propertyIds: string[]
  ): Observable<void> {
    return new Observable((subscriber) => {
      const source = this._source();
      const sourceId = this._sourceId();
      const mode = this._bulkSelectionMode();

      if (!source || !sourceId || !mode) {
        subscriber.error(new Error('Bulk selection is not supported for this detail view.'));
        return;
      }

      if (action === 'include' && mode !== 'query-include-exclude') {
        subscriber.error(new Error('Include is not supported for this detail view.'));
        return;
      }

      const context = this.resolveContext(source);
      const handler = action === 'exclude' ? context.excludeSelected : context.includeSelected;

      if (!handler) {
        subscriber.error(new Error('Bulk selection is not supported for this detail view.'));
        return;
      }

      this._loading.set(true);
      this._error.set(null);

      handler
        .call(context, sourceId, propertyIds, this._activeFilter(), {
          ...this._initState(),
          title: this._title()
        })
        .subscribe({
          next: (result) => {
            this.applyLoadResult(result);
            subscriber.next();
            subscriber.complete();
          },
          error: (err: Error) => {
            this._loading.set(false);
            subscriber.error(err);
          }
        });
    });
  }

  destroy(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }

    this._source.set(null);
    this._sourceId.set(null);
    this._initState.set(undefined);
    this._title.set('');
    this._titleLabel.set('Selected');
    this._criteriaChips.set([]);
    this._geometry.set(undefined);
    this._allRows.set([]);
    this._rows.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._totalCount.set(0);
    this._activeFilter.set(DETAIL_PAGE_DEFAULT_FILTER);
    this._showFilter.set(false);
    this._filterOptions.set([]);
    this._bulkSelectionMode.set(null);
    this._leadsTypes.set([]);
    this._searchText.set('');
    this._searchField.set('$');
  }

  private resolveContext(source: string): DetailContext {
    if (source === 'farm') {
      return this.farmDetailContext;
    }

    if (source === 'search') {
      return this.searchDetailContext;
    }

    if (source === 'query') {
      return this.queryDetailContext;
    }

    if (source === 'statistics') {
      return this.statisticsDetailContext;
    }

    throw new Error(`Unsupported detail source: ${source}`);
  }

  private handleLoadError(source: string, err: Error, fallbackMessage: string): void {
    if (source === 'query' && isQuerySessionExpiredError(err)) {
      this._loading.set(false);
      void this.router.navigate(['/farming/area-search']);
      return;
    }

    if (source === 'statistics' && isStatisticsSessionExpiredError(err)) {
      this._loading.set(false);
      void this.router.navigate(['/statistics/radius-search']);
      return;
    }

    this._loading.set(false);
    this._error.set(err.message ?? fallbackMessage);
    this._allRows.set([]);
    this._rows.set([]);
    this._totalCount.set(0);
  }

  private applyLoadResult(result: {
    title: string;
    titleLabel: string;
    geometry?: SavedFarmGeometry | SavedFarmGeometry[];
    rows: Record<string, unknown>[];
    totalCount: number;
    activeFilter: string;
    showFilter: boolean;
    filterOptions: { value: string; label: string }[];
    bulkSelectionMode?: 'farm-exclude' | 'query-include-exclude';
    leadsTypes?: string[];
    criteriaChips?: AreaSearchCriteriaChip[];
  }): void {
    this._title.set(result.title);
    this._titleLabel.set(result.titleLabel);
    this._criteriaChips.set(result.criteriaChips ?? []);
    this._geometry.set(result.geometry);
    this._allRows.set(result.rows);
    this._totalCount.set(result.totalCount);
    this._activeFilter.set(result.activeFilter);
    this._showFilter.set(result.showFilter);
    this._filterOptions.set(result.filterOptions);
    this._bulkSelectionMode.set(result.bulkSelectionMode ?? null);
    this._leadsTypes.set(result.leadsTypes ?? []);
    this._loading.set(false);
    this._error.set(null);

    this._initState.set({
      title: result.title,
      geometry: result.geometry
    });

    this.refreshFilteredRows();
  }

  private refreshFilteredRows(): void {
    const filtered = this._allRows().filter((row) => this.matchesClientFilters(row));
    this._rows.set(filtered);
  }

  private matchesClientFilters(row: Record<string, unknown>): boolean {
    const query = this._searchText().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const field = this._searchField();
    const searchableByField = row['searchableByField'] as Record<string, string> | undefined;
    if (!searchableByField) {
      return false;
    }

    if (field === '$') {
      return Object.values(searchableByField).some((value) => value.includes(query));
    }

    return (searchableByField[field] ?? '').includes(query);
  }
}
