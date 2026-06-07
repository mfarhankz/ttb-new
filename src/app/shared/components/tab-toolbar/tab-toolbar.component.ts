import { Component, inject, viewChild } from '@angular/core';
import { Menu } from 'primeng/menu';
import { DashboardTabToolbarService } from '@app/core/services/dashboard-tab-toolbar.service';

@Component({
  selector: 'app-tab-toolbar',
  standalone: true,
  imports: [Menu],
  templateUrl: './tab-toolbar.component.html'
})
export class TabToolbarComponent {
  readonly toolbar = inject(DashboardTabToolbarService);
  readonly actionsMenu = viewChild.required<Menu>('actionsMenu');

  toggleFilters(event: Event): void {
    this.toolbar.toggleFilters();
    (event.currentTarget as HTMLButtonElement).blur();
  }

  toggleActionsMenu(event: Event): void {
    this.actionsMenu().toggle(event);
    (event.currentTarget as HTMLButtonElement).blur();
  }
}
