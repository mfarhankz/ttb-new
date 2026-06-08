export type MapPipelineViewMode = 'map' | 'list' | 'both';

export interface MapPipelineSplitRatio {
  first: number;
  last: number;
}

export interface MapTablePipelineConfig {
  storageKey?: string;
  defaultSplit?: MapPipelineSplitRatio;
  minPanelWidthPx?: number;
  autoShowTableOnResults?: boolean;
  defaultViewMode?: MapPipelineViewMode;
}
