import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../../../../../core/services/auth.service';
import { UserUsageService } from '../../../../../core/services/user-usage.service';
import { UsageReportTableComponent } from '../../../../../shared/components/usage-report-table/usage-report-table.component';

@Component({
  selector: 'app-download-history-panel',
  standalone: true,
  imports: [UsageReportTableComponent],
  templateUrl: './download-history-panel.component.html'
})
export class DownloadHistoryPanelComponent {
  private readonly authService = inject(AuthService);
  private readonly userUsageService = inject(UserUsageService);

  private lastFetchedUserId: number | string | null = null;

  readonly details = this.userUsageService.details;
  readonly loading = this.userUsageService.loading;
  readonly error = this.userUsageService.error;

  constructor() {
    effect(() => {
      const userId = this.authService.getUserId();
      if (userId != null && userId !== this.lastFetchedUserId) {
        this.lastFetchedUserId = userId;
        this.userUsageService.fetchUserUsage();
      }
    });
  }
}
