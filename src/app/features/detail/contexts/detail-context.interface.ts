import { Observable } from 'rxjs';
import { SavedFarmGeometry } from '@app/core/interfaces/saved-farm.interface';
import { DetailFilterOption } from '@app/features/detail/config/detail-page.config';
import { AreaSearchCriteriaChip } from '@app/core/utils/area-search-criteria.util';

export interface DetailContextInitState {
  title?: string;
  geometry?: SavedFarmGeometry | SavedFarmGeometry[];
}

export interface DetailToolbarConfig {
  titleLabel: string;
  title: string;
  showFilter: boolean;
  filterOptions: DetailFilterOption[];
  activeFilter: string;
}

export interface DetailContextLoadResult {
  title: string;
  geometry?: SavedFarmGeometry | SavedFarmGeometry[];
  rows: Record<string, unknown>[];
  totalCount: number;
  activeFilter: string;
  filterOptions: DetailFilterOption[];
  showFilter: boolean;
  titleLabel: string;
  bulkSelectionMode?: 'farm-exclude' | 'query-include-exclude';
  leadsTypes?: string[];
  criteriaChips?: AreaSearchCriteriaChip[];
}

export interface DetailContext {
  readonly source: string;

  load(sourceId: string, initState?: DetailContextInitState): Observable<DetailContextLoadResult>;

  refresh(
    sourceId: string,
    activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult>;

  setFilter(
    sourceId: string,
    filter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult>;

  excludeSelected?(
    sourceId: string,
    propertyIds: Array<number | string>,
    activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult>;

  includeSelected?(
    sourceId: string,
    propertyIds: Array<number | string>,
    activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult>;
}
