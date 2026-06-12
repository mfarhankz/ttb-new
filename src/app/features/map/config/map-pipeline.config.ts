import {
  MapPipelineViewMode,
  MapPipelineViewOption,
  MapTablePipelineConfig
} from '@app/features/map/components/map-table-pipeline/map-table-pipeline.types';

export const MAP_PIPELINE_STORAGE_KEY = 'VRrecentDragRatio';

export const MAP_PIPELINE_ALL_VIEW_MODES: MapPipelineViewMode[] = ['map', 'list', 'both'];

export const DEFAULT_MAP_PIPELINE_CONFIG: Required<Omit<MapTablePipelineConfig, 'viewModes'>> & {
  viewModes: MapPipelineViewMode[];
} = {
  storageKey: MAP_PIPELINE_STORAGE_KEY,
  defaultSplit: { first: 50, last: 50 },
  minPanelWidthPx: 150,
  autoShowTableOnResults: false,
  defaultViewMode: 'list',
  viewModes: MAP_PIPELINE_ALL_VIEW_MODES
};

export const MAP_PIPELINE_VIEW_OPTIONS: MapPipelineViewOption[] = [
  { mode: 'map', label: 'Map', icon: 'pi pi-map' },
  { mode: 'list', label: 'List', icon: 'pi pi-list' },
  { mode: 'both', label: 'Split', icon: 'pi pi-table' }
];
