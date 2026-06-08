import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DetailContext, DetailContextInitState } from '../detail-contexts/detail-context.interface';
import {
  FarmDetailContext,
  isUnsupportedDetailSource
} from '../detail-contexts/farm-detail.context';
import {
  DETAIL_PAGE_DEFAULT_FILTER,
  resolveVisibleDetailColumns
} from '../config/detail-page.config';
import { SavedFarmGeometry } from '../interfaces/saved-farm.interface';

const SEARCH_DEBOUNCE_MS = 320;

@Injectable({ providedIn: 'root' })
export class DetailPageService {
  private readonly farmDetailContext = inject(FarmDetailContext);

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
  private readonly _supportsDelete = signal(false);
  private readonly _leadsTypes = signal<string[]>([]);
  private readonly _searchText = signal('');
  private readonly _searchField = signal('$');

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
  readonly supportsDelete = this._supportsDelete.asReadonly();
  readonly searchText = this._searchText.asReadonly();
  readonly searchField = this._searchField.asReadonly();

  readonly columns = computed(() => resolveVisibleDetailColumns(this._allRows(), this._leadsTypes()));

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
        this._loading.set(false);
        this._error.set(err.message ?? 'Failed to load detail records.');
        this._allRows.set([]);
        this._rows.set([]);
        this._totalCount.set(0);
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
        this._loading.set(false);
        this._error.set(err.message ?? 'Failed to refresh detail records.');
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
        this._loading.set(false);
        this._error.set(err.message ?? 'Failed to load filtered records.');
        this._allRows.set([]);
        this._rows.set([]);
        this._totalCount.set(0);
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
    return new Observable((subscriber) => {
      const source = this._source();
      const sourceId = this._sourceId();
      if (!source || !sourceId || !this._supportsDelete()) {
        subscriber.error(new Error('Delete is not supported for this detail view.'));
        return;
      }

      const context = this.resolveContext(source);
      if (!context.excludeSelected) {
        subscriber.error(new Error('Delete is not supported for this detail view.'));
        return;
      }

      this._loading.set(true);
      this._error.set(null);

      context
        .excludeSelected(sourceId, propertyIds, this._activeFilter(), {
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
    this._geometry.set(undefined);
    this._allRows.set([]);
    this._rows.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._totalCount.set(0);
    this._activeFilter.set(DETAIL_PAGE_DEFAULT_FILTER);
    this._showFilter.set(false);
    this._filterOptions.set([]);
    this._supportsDelete.set(false);
    this._leadsTypes.set([]);
    this._searchText.set('');
    this._searchField.set('$');
  }

  private resolveContext(source: string): DetailContext {
    if (source === 'farm') {
      return this.farmDetailContext;
    }

    throw new Error(`Unsupported detail source: ${source}`);
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
    supportsDelete?: boolean;
    leadsTypes?: string[];
  }): void {
    this._title.set(result.title);
    this._titleLabel.set(result.titleLabel);
    this._geometry.set(result.geometry);
    this._allRows.set(result.rows);
    this._totalCount.set(result.totalCount);
    this._activeFilter.set(result.activeFilter);
    this._showFilter.set(result.showFilter);
    this._filterOptions.set(result.filterOptions);
    this._supportsDelete.set(!!result.supportsDelete);
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
