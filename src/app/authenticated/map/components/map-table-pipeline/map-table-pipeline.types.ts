export type MapPipelineViewMode = 'map' | 'list' | 'both';

export interface MapPipelineSplitRatio {
  first: number;
  last: number;
}

export interface MapPipelineViewOption {
  mode: MapPipelineViewMode;
  label: string;
  icon: string;
}

export interface MapTablePipelineConfig {
  storageKey?: string;
  defaultSplit?: MapPipelineSplitRatio;
  minPanelWidthPx?: number;
  autoShowTableOnResults?: boolean;
  defaultViewMode?: MapPipelineViewMode;
  /** View modes shown in the toggle; defaults to map, list, and split (both). */
  viewModes?: MapPipelineViewMode[];
}
