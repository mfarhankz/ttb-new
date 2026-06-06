import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Users</h1>
      <p class="mt-2 text-muted">Manage user accounts and permissions.</p>
    </div>
  `
})
export class AdminUsersComponent {}
