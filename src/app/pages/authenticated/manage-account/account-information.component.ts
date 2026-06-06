import { Component } from '@angular/core';

@Component({
  selector: 'app-account-information',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Account Information</h1>
      <p class="mt-2 text-muted">View and update your account details.</p>
    </div>
  `
})
export class AccountInformationComponent {}
