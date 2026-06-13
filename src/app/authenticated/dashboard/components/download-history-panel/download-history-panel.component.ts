import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from '@app/core/services/auth.service';
import { DashboardTabToolbarService } from '@app/authenticated/dashboard/services/dashboard-tab-toolbar.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { UserUsageService } from '@app/authenticated/dashboard/services/user-usage.service';
import { printSectionElement } from '@app/core/utils/print-section.util';
import { UsageReportTableComponent } from '@app/shared/ui/usage-report-table/usage-report-table.component';

@Component({
  selector: 'app-download-history-panel',
  standalone: true,
  imports: [UsageReportTableComponent],
  templateUrl: './download-history-panel.component.html'
})
export class DownloadHistoryPanelComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userUsageService = inject(UserUsageService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly tabToolbar = inject(DashboardTabToolbarService);

  private readonly printRoot = viewChild.required<ElementRef<HTMLElement>>('printRoot');

  readonly details = this.userUsageService.details;
  readonly loading = this.userUsageService.loading;
  readonly error = this.userUsageService.error;
  readonly userName = computed(() => this.authService.getUserName() ?? 'User');
  readonly printDisabled = computed(() => this.loading() || !this.details());

  readonly toolbarMenuItems = signal<MenuItem[]>([]);

  constructor() {
    effect(() => {
      if (this.authService.getUserId() != null) {
        this.sessionExpiredService.sessionRenewed();
        untracked(() => this.userUsageService.fetchUserUsage());
      }
    });
  }

  ngAfterViewInit(): void {
    this.tabToolbar.register({
      menuItems: this.toolbarMenuItems,
      primaryAction: {
        label: 'Print',
        icon: 'pi pi-print',
        disabled: this.printDisabled,
        action: () => this.printSection()
      }
    });
  }

  ngOnDestroy(): void {
    this.tabToolbar.unregister();
  }

  printSection(): void {
    printSectionElement(this.printRoot().nativeElement);
  }
}
