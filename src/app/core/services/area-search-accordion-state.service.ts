import { Injectable, signal } from '@angular/core';

export type AreaSearchAccordionId = 'premier-note' | 'oaf' | 'pricing-details' | 'dnc-notice';

export type AreaSearchAccordionValue =
  | string
  | number
  | string[]
  | number[]
  | null
  | undefined;

@Injectable({ providedIn: 'root' })
export class AreaSearchAccordionStateService {
  private readonly openId = signal<AreaSearchAccordionId | null>(null);

  panelValue(id: AreaSearchAccordionId): AreaSearchAccordionId | null {
    return this.openId() === id ? id : null;
  }

  onPanelChange(id: AreaSearchAccordionId, value: AreaSearchAccordionValue): void {
    const next = this.normalize(value);
    if (next === id) {
      this.openId.set(id);
      return;
    }

    if (this.openId() === id) {
      this.openId.set(null);
    }
  }

  closeAll(): void {
    this.openId.set(null);
  }

  private normalize(value: AreaSearchAccordionValue): AreaSearchAccordionId | null {
    if (value == null || value === '') {
      return null;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      return typeof first === 'string' ? (first as AreaSearchAccordionId) : null;
    }

    return typeof value === 'string' ? (value as AreaSearchAccordionId) : null;
  }
}
