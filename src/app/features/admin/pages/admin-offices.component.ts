import { Component } from '@angular/core';
import { AdminOfficesPanelComponent } from '@app/features/admin/components/admin-offices-panel/admin-offices-panel.component';

@Component({
  selector: 'app-admin-offices',
  standalone: true,
  imports: [AdminOfficesPanelComponent],
  template: `
    <div class="p-8">
      <app-admin-offices-panel />
    </div>
  `
})
export class AdminOfficesComponent {}
