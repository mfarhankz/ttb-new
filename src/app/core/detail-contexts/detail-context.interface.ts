import { Observable } from 'rxjs';
import { SavedFarmGeometry } from '../interfaces/saved-farm.interface';
import { DetailFilterOption } from '../config/detail-page.config';

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
  supportsDelete?: boolean;
  leadsTypes?: string[];
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
}
