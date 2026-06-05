import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './authenticated-layout.component.html',
  styles: [`
    .authenticated-shell {
      min-height: 100vh;
      background: #f9fafb;
    }
    .authenticated-main {
      margin-left: var(--sidebar-width, 260px);
      min-height: 100vh;
      transition: margin-left 0.2s ease;
    }
    .authenticated-shell.sidebar-collapsed .authenticated-main {
      margin-left: var(--sidebar-width-collapsed, 72px);
    }
  `]
})
export class AuthenticatedLayoutComponent {
  private layoutService = inject(LayoutService);

  collapsed = signal(false);

  onSidebarCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
    this.layoutService.setSidebarCollapsed(collapsed);
  }
}
