import { Injectable, Signal, signal, TemplateRef } from '@angular/core';
import { MenuItem } from 'primeng/api';

export interface TabToolbarRegistration {
  menuItems: Signal<MenuItem[]>;
  hasActiveFilters: Signal<boolean>;
  filterPanel: TemplateRef<unknown>;
  hint?: Signal<string | null>;
}

@Injectable({ providedIn: 'root' })
export class DashboardTabToolbarService {
  private readonly _registration = signal<TabToolbarRegistration | null>(null);

  readonly filtersOpen = signal(false);

  readonly registration = this._registration.asReadonly();

  readonly showToolbar = (): boolean => this._registration() !== null;

  readonly menuItems = (): MenuItem[] => this._registration()?.menuItems() ?? [];

  readonly hasActiveFilters = (): boolean => this._registration()?.hasActiveFilters() ?? false;

  readonly filterPanel = (): TemplateRef<unknown> | null =>
    this._registration()?.filterPanel ?? null;

  readonly hint = (): string | null => {
    const hintSignal = this._registration()?.hint;
    return hintSignal ? hintSignal() : null;
  };

  register(registration: TabToolbarRegistration): void {
    this._registration.set(registration);
    this.filtersOpen.set(false);
  }

  unregister(): void {
    this._registration.set(null);
    this.filtersOpen.set(false);
  }

  toggleFilters(): void {
    if (!this._registration()) {
      return;
    }

    this.filtersOpen.update((open) => !open);
  }
}
