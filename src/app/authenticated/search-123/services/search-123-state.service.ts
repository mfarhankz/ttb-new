import { Injectable, signal } from '@angular/core';
import { Search123Shape } from '@app/authenticated/search-123/config/search-123.config';
import { MapDrawnGeometry } from '@app/authenticated/map/services/ol-map.service';

@Injectable({ providedIn: 'root' })
export class Search123StateService {
  private readonly _geometry = signal<MapDrawnGeometry | null>(null);
  private readonly _selectedShape = signal<Search123Shape | null>(null);

  readonly geometry = this._geometry.asReadonly();
  readonly selectedShape = this._selectedShape.asReadonly();

  setDrawnArea(geometry: MapDrawnGeometry, shape: Search123Shape): void {
    this._geometry.set(geometry);
    this._selectedShape.set(shape);
  }

  clearDrawnArea(): void {
    this._geometry.set(null);
    this._selectedShape.set(null);
  }
}
