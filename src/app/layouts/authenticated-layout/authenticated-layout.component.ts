import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './authenticated-layout.component.html',
  styles: []
})
export class AuthenticatedLayoutComponent {
  private layoutService = inject(LayoutService);

  collapsed = signal(false);

  onSidebarCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
    this.layoutService.setSidebarCollapsed(collapsed);
  }
}
