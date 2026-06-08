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

  /** Collapse or expand the sidebar from page content (e.g. map split view). */
  requestSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapseRequest$.next(collapsed);
  }

  private readonly sidebarCollapseRequest$ = new Subject<boolean>();
  readonly onSidebarCollapseRequest = this.sidebarCollapseRequest$.asObservable();

  notifySidebarResize(): void {
    this.sidebarResize$.next();
  }
}
