import { Component } from '@angular/core';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Account Settings</h1>
      <p class="mt-2 text-muted">Manage preferences and account options.</p>
    </div>
  `
})
export class AccountSettingsComponent {}
