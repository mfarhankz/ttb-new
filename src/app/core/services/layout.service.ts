import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarCollapsed = signal(false);

  /** Emits when sidebar width changes so map/content can resize. */
  private readonly sidebarResize$ = new Subject<void>();
  readonly onSidebarResize = this.sidebarResize$.asObservable();

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
    this.sidebarResize$.next();
  }

  notifySidebarResize(): void {
    this.sidebarResize$.next();
  }
}
