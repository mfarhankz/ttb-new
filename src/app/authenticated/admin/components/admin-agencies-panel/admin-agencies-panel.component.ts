import { Component } from '@angular/core';
import { AdminSectionShellComponent } from '../admin-section-shell/admin-section-shell.component';

@Component({
  selector: 'app-admin-agencies-panel',
  standalone: true,
  imports: [AdminSectionShellComponent],
  templateUrl: './admin-agencies-panel.component.html'
})
export class AdminAgenciesPanelComponent {}
