import { Component } from '@angular/core';
import { AdminUsersPanelComponent } from '../dashboard/components/admin-users-panel/admin-users-panel.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [AdminUsersPanelComponent],
  template: `
    <div class="p-8">
      <app-admin-users-panel />
    </div>
  `
})
export class AdminUsersComponent {}
