import { NgStyle } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild
} from '@angular/core';
import {
  DEFAULT_MAP_PIPELINE_CONFIG
} from '@app/core/config/map-pipeline.config';
import { LayoutService } from '@app/core/services/layout.service';
import { MapPipelineSplitRatio, MapPipelineViewMode, MapTablePipelineConfig } from './map-table-pipeline.types';
import { MapPipelineViewToggleComponent } from './map-pipeline-view-toggle.component';

@Component({
  selector: 'app-map-table-pipeline',
  standalone: true,
  imports: [MapPipelineViewToggleComponent, NgStyle],
  templateUrl: './map-table-pipeline.component.html'
})
export class MapTablePipelineComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);

  readonly config = input<MapTablePipelineConfig>({});
  readonly mapResize = output<void>();
  readonly viewModeChange = output<MapPipelineViewMode>();
  readonly splitRatioChange = output<MapPipelineSplitRatio>();

  readonly viewMode = signal<MapPipelineViewMode>(DEFAULT_MAP_PIPELINE_CONFIG.defaultViewMode);
  readonly splitRatio = signal<MapPipelineSplitRatio>({ ...DEFAULT_MAP_PIPELINE_CONFIG.defaultSplit });
  readonly isDragging = signal(false);

  private readonly containerRef = viewChild.required<ElementRef<HTMLElement>>('container');
  private sidebarResizeSub?: { unsubscribe(): void };
  private dragStartX = 0;
  private dragStartRatio: MapPipelineSplitRatio | null = null;

  ngOnInit(): void {
    this.viewMode.set(this.resolvedConfig().defaultViewMode);
    this.splitRatio.set(this.loadStoredSplitRatio());
    this.sidebarResizeSub = this.layoutService.onSidebarResize.subscribe(() => {
      this.scheduleMapResize();
    });
  }

  ngOnDestroy(): void {
    this.sidebarResizeSub?.unsubscribe();
  }

  onViewModeChange(mode: MapPipelineViewMode): void {
    this.viewMode.set(mode);
    this.viewModeChange.emit(mode);
    this.scheduleMapResize();
  }

  /** Show map panel when table row preview needs geometry (e.g. farm hover). */
  ensureMapVisibleForPreview(): void {
    if (this.viewMode() === 'list') {
      this.onViewModeChange('both');
      return;
    }

    this.scheduleMapResize();
  }

  onSplitRatioChange(ratio: MapPipelineSplitRatio): void {
    this.splitRatio.set(ratio);
    this.splitRatioChange.emit(ratio);
    this.persistSplitRatio(ratio);
  }

  onDragStart(event: PointerEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
    this.dragStartX = event.clientX;
    this.dragStartRatio = { ...this.splitRatio() };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  @HostListener('document:pointermove', ['$event'])
  onDragMove(event: PointerEvent): void {
    if (!this.isDragging() || !this.dragStartRatio) {
      return;
    }

    const container = this.containerRef().nativeElement;
    const rect = container.getBoundingClientRect();
    const minWidth = this.resolvedConfig().minPanelWidthPx;
    const deltaPercent = ((event.clientX - this.dragStartX) / rect.width) * 100;
    const minFirst = (minWidth / rect.width) * 100;
    const minLast = (minWidth / rect.width) * 100;

    let first = this.dragStartRatio.first + deltaPercent;
    first = Math.min(Math.max(first, minFirst), 100 - minLast);

    this.onSplitRatioChange({ first, last: 100 - first });
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  onDragEnd(): void {
    if (!this.isDragging()) {
      return;
    }

    this.isDragging.set(false);
    this.dragStartRatio = null;
    this.scheduleMapResize();
  }

  scheduleMapResize(delayMs = 170): void {
    setTimeout(() => this.mapResize.emit(), delayMs);
  }

  mapPanelStyle(): Record<string, string> {
    const mode = this.viewMode();
    if (mode === 'list') {
      return { flex: '0 0 0', width: '0', minWidth: '0', overflow: 'hidden' };
    }
    if (mode === 'map') {
      return { flex: '1 1 100%', minWidth: '0' };
    }
    return { flex: `0 0 ${this.splitRatio().first}%`, minWidth: '0' };
  }

  tablePanelStyle(): Record<string, string> {
    const mode = this.viewMode();
    if (mode === 'map') {
      return { flex: '0 0 0', width: '0', minWidth: '0', overflow: 'hidden' };
    }
    if (mode === 'list') {
      return { flex: '1 1 100%', minWidth: '0' };
    }
    return { flex: `0 0 ${this.splitRatio().last}%`, minWidth: '0' };
  }

  private resolvedConfig(): Required<MapTablePipelineConfig> {
    const overrides = this.config();
    return {
      storageKey: overrides.storageKey ?? DEFAULT_MAP_PIPELINE_CONFIG.storageKey,
      defaultSplit: overrides.defaultSplit ?? DEFAULT_MAP_PIPELINE_CONFIG.defaultSplit,
      minPanelWidthPx: overrides.minPanelWidthPx ?? DEFAULT_MAP_PIPELINE_CONFIG.minPanelWidthPx,
      autoShowTableOnResults: overrides.autoShowTableOnResults ?? DEFAULT_MAP_PIPELINE_CONFIG.autoShowTableOnResults,
      defaultViewMode: overrides.defaultViewMode ?? DEFAULT_MAP_PIPELINE_CONFIG.defaultViewMode
    };
  }

  private loadStoredSplitRatio(): MapPipelineSplitRatio {
    const cfg = this.resolvedConfig();

    try {
      const raw = localStorage.getItem(cfg.storageKey);
      if (!raw) {
        return { ...cfg.defaultSplit };
      }

      const parsed = JSON.parse(raw) as MapPipelineSplitRatio;
      if (
        typeof parsed.first === 'number' &&
        typeof parsed.last === 'number' &&
        Math.abs(parsed.first + parsed.last - 100) < 0.5
      ) {
        return parsed;
      }
    } catch {
      // ignore invalid storage
    }

    return { ...cfg.defaultSplit };
  }

  private persistSplitRatio(ratio: MapPipelineSplitRatio): void {
    try {
      localStorage.setItem(this.resolvedConfig().storageKey, JSON.stringify(ratio));
    } catch {
      // ignore quota errors
    }
  }
}
