import { Component, input, output } from '@angular/core';
import { MAP_PIPELINE_VIEW_OPTIONS } from '@app/features/map/config/map-pipeline.config';
import { MapPipelineViewMode, MapPipelineViewOption } from './map-table-pipeline.types';

@Component({
  selector: 'app-map-pipeline-view-toggle',
  standalone: true,
  templateUrl: './map-pipeline-view-toggle.component.html'
})
export class MapPipelineViewToggleComponent {
  readonly options = input<MapPipelineViewOption[]>(MAP_PIPELINE_VIEW_OPTIONS);
  readonly value = input.required<MapPipelineViewMode>();
  readonly valueChange = output<MapPipelineViewMode>();

  select(mode: MapPipelineViewMode): void {
    if (mode !== this.value()) {
      this.valueChange.emit(mode);
    }
  }
}
