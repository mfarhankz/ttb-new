import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Admin</h1>
      <p class="mt-2 text-muted">Manage users, agencies, and offices.</p>
    </div>
  `
})
export class AdminComponent {}
