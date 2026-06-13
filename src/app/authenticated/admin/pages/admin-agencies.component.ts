import { Component } from '@angular/core';
import { AdminAgenciesPanelComponent } from '@app/authenticated/admin/components/admin-agencies-panel/admin-agencies-panel.component';

@Component({
  selector: 'app-admin-agencies',
  standalone: true,
  imports: [AdminAgenciesPanelComponent],
  template: `
    <div class="p-8">
      <app-admin-agencies-panel />
    </div>
  `
})
export class AdminAgenciesComponent {}
