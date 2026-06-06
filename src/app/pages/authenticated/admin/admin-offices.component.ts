import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-offices',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Offices</h1>
      <p class="mt-2 text-muted">Manage offices and agency settings.</p>
    </div>
  `
})
export class AdminOfficesComponent {}
