import { Component } from '@angular/core';

@Component({
  selector: 'app-download-history',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Download History</h1>
      <p class="mt-2 text-muted">View your past downloads and exports.</p>
    </div>
  `
})
export class DownloadHistoryComponent {}
