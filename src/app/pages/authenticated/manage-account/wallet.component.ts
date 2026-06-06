import { Component } from '@angular/core';

@Component({
  selector: 'app-wallet',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Wallet</h1>
      <p class="mt-2 text-muted">View wallet balance and credit information.</p>
    </div>
  `
})
export class WalletComponent {}
