import { MapPipelineViewMode, MapTablePipelineConfig } from '@app/shared/components/map-table-pipeline/map-table-pipeline.types';

export const MAP_PIPELINE_STORAGE_KEY = 'VRrecentDragRatio';

export const DEFAULT_MAP_PIPELINE_CONFIG: Required<MapTablePipelineConfig> = {
  storageKey: MAP_PIPELINE_STORAGE_KEY,
  defaultSplit: { first: 50, last: 50 },
  minPanelWidthPx: 150,
  autoShowTableOnResults: false,
  defaultViewMode: 'list'
};

export const MAP_PIPELINE_VIEW_OPTIONS: { mode: MapPipelineViewMode; label: string; icon: string }[] = [
  { mode: 'map', label: 'Map', icon: 'pi pi-map' },
  { mode: 'list', label: 'List', icon: 'pi pi-list' },
  { mode: 'both', label: 'Both', icon: 'pi pi-table' }
];
