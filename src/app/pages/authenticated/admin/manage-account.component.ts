import { Component } from '@angular/core';

@Component({
  selector: 'app-manage-account',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Manage Account</h1>
      <p class="mt-2 text-muted">Account settings, billing, and subscription.</p>
    </div>
  `
})
export class ManageAccountComponent {}
