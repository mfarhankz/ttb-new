import { Component } from '@angular/core';

@Component({
  selector: 'app-manage-reports',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Manage Reports</h1>
      <p class="mt-2 text-muted">View order history and upload records.</p>
    </div>
  `
})
export class ManageReportsComponent {}
