import { Injectable, signal } from '@angular/core';
import { NetSheetConfig } from '../interfaces/net-sheet.interface';

@Injectable({ providedIn: 'root' })
export class NetSheetModalService {
  private readonly _activeConfig = signal<NetSheetConfig | null>(null);

  readonly activeConfig = this._activeConfig.asReadonly();

  open(config: NetSheetConfig): void {
    this._activeConfig.set(config);
  }

  close(): void {
    this._activeConfig.set(null);
  }
}
