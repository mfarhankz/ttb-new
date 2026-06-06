import { Component, Input } from '@angular/core';
import {
  USAGE_COUNT_GROUPS,
  USAGE_EXPORT_GROUPS,
  USAGE_REPORT_GROUPS,
  UsageMetricPair,
  UserUsageDetails
} from '../../../core/interfaces/user-usage.interface';

@Component({
  selector: 'app-usage-report-table',
  standalone: true,
  templateUrl: './usage-report-table.component.html'
})
export class UsageReportTableComponent {
  @Input() details: UserUsageDetails | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;

  readonly countGroups = USAGE_COUNT_GROUPS;
  readonly reportGroups = USAGE_REPORT_GROUPS;
  readonly exportGroups = USAGE_EXPORT_GROUPS;

  reportCount(period: string, metric: string): number {
    return Number(this.details?.total_report_ordered?.[period]?.[metric] ?? 0);
  }

  netsheetCount(period: string): number {
    return Number(this.details?.total_netsheet_pulled?.[period]?.netsheet?.request_count ?? 0);
  }

  exportPair(period: string, metric: string): string {
    const value = this.details?.total_recs_exported?.[period]?.[metric];
    return this.formatPair(value, 'request_count', 'recs_count');
  }

  pulledTypes(): string[] {
    const allTime = this.details?.total_recs_pulled?.['all_time'] ?? {};
    return Object.keys(allTime).filter(key => key !== 'all_types');
  }

  pulledPair(period: string, metric: string): string {
    const value = this.details?.total_recs_pulled?.[period]?.[metric];
    return this.formatPair(value, 'request_count', 'recs_count');
  }

  queryCount(period: string, metric: string): number {
    return Number(this.details?.total_queries?.[period]?.[metric] ?? 0);
  }

  farmTypes(): string[] {
    const allTime = this.details?.total_farms?.['all_time'] ?? {};
    return Object.keys(allTime).filter(key => key !== 'all_types');
  }

  farmPair(period: string, metric: string): string {
    const value = this.details?.total_farms?.[period]?.[metric];
    return this.formatPair(value, 'farm_count', 'recs_count');
  }

  emailedPair(period: string): string {
    const value = this.details?.total_data_emailed?.[period];
    return this.formatPair(value, 'email_count', 'recs_count');
  }

  loginCount(period: string): number {
    return Number(this.details?.total_logins?.[period]?.login_count ?? 0);
  }

  private formatPair(
    value: unknown,
    countField: keyof UsageMetricPair,
    recsField: keyof UsageMetricPair
  ): string {
    if (!value || typeof value !== 'object') {
      return '0 - 0';
    }

    const pair = value as UsageMetricPair;
    return `${pair[countField] ?? 0} - ${pair[recsField] ?? 0}`;
  }
}
