import { Component } from '@angular/core';

@Component({
  selector: 'app-subscription',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Subscription</h1>
      <p class="mt-2 text-muted">Manage your subscription plan and billing.</p>
    </div>
  `
})
export class SubscriptionComponent {}
