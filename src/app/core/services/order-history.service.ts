import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { formatReportType } from '../config/report-labels.config';
import {
  OrderHistoryAddressCol,
  OrderHistoryRecord,
  OrderPipelineResponse
} from '../interfaces/order-history.interface';
import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';

export const ORDER_HISTORY_COLUMNS: DataTableColumn[] = [
  { key: 'orderedBy', label: 'Ordered By', sortType: 'text', truncate: true, width: 'min-w-[10rem]' },
  { key: 'officeName', label: 'Office Name', sortType: 'text', truncate: true, width: 'min-w-[10rem]' },
  { key: 'address', label: 'Address', sortType: 'text', truncate: true, width: 'min-w-[14rem]' },
  { key: 'reportDate', label: 'Report Date', sortType: 'date', width: 'min-w-[9rem]', nowrap: true },
  { key: 'reportType', label: 'Report Type', sortType: 'text', truncate: true, width: 'min-w-[12rem]' }
];

@Injectable({ providedIn: 'root' })
export class OrderHistoryService {
  private readonly apiService = inject(ApiService);

  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalCount = signal(0);

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly columns = ORDER_HISTORY_COLUMNS;

  private loadSucceeded = false;

  fetchOrderHistory(page = 1, force = false): void {
    if (!force && this.loadSucceeded) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    if (force) {
      this._rows.set([]);
      this._totalCount.set(0);
    }

    this.apiService
      .getParsedJson<OrderPipelineResponse>(`${API_CONFIG.endpoints.orderPipeline}:${page}.json`, {
        treatEmptyAs: {}
      })
      .subscribe({
        next: (response) => {
          try {
            const payload = this.normalizePipelineResponse(response);
            const records = Array.isArray(payload.data) ? payload.data : [];

            this._rows.set(records.map((record, index) => this.mapRecord(record, index)));
            this._totalCount.set(payload.count ?? records.length);
            this.loadSucceeded = true;
            this._loading.set(false);
          } catch (err) {
            this.loadSucceeded = false;
            this._error.set(err instanceof Error ? err.message : 'Failed to load order history.');
            this._loading.set(false);
          }
        },
        error: (err) => {
          this.loadSucceeded = false;
          this._error.set(err.message ?? 'Failed to load order history.');
          this._loading.set(false);
        }
      });
  }

  invalidateCache(): void {
    this.loadSucceeded = false;
    this._rows.set([]);
    this._totalCount.set(0);
    this._error.set(null);
    this._loading.set(false);
  }

  private normalizePipelineResponse(
    response: OrderPipelineResponse | string | null | undefined
  ): { count: number; data: OrderHistoryRecord[] } {
    if (!response || typeof response === 'string') {
      return { count: 0, data: [] };
    }

    const envelope = response.response;

    if (envelope?.status === 'ERROR') {
      throw new Error(envelope.message ?? 'Failed to load order history.');
    }

    const body = envelope?.status === 'OK' ? envelope : envelope ?? response;
    const count = Number(body.count ?? 0);
    const data = this.normalizeRecords(body.data);

    if (!count && !data.length) {
      return { count: 0, data: [] };
    }

    return { count: count || data.length, data };
  }

  private normalizeRecords(data: OrderHistoryRecord[] | Record<string, OrderHistoryRecord> | undefined): OrderHistoryRecord[] {
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data;
    }

    return Object.values(data);
  }

  private mapRecord(record: OrderHistoryRecord, index: number): Record<string, unknown> {
    const userId = record.user_col?.users_id ?? record.user_col?.user_id;

    return {
      id: userId != null ? `${userId}-${index}` : index,
      orderedBy: record.user_col?.name?.trim() || '—',
      officeName: record.office_col?.name?.trim() || '—',
      address: this.formatAddress(record.address_col),
      reportDate: this.formatDate(record.status_col?.date_time),
      reportType: formatReportType(record.report_col?.type),
      canViewUsage: !!record.status_col?.report_fetch_id,
      raw: record
    };
  }

  private formatAddress(address?: OrderHistoryAddressCol): string {
    if (!address) {
      return '—';
    }

    const parts = [
      address.site_address,
      address.site_unit,
      address.site_city,
      address.site_state,
      address.site_zip
    ]
      .map((part) => (part == null ? '' : String(part).trim()))
      .filter(Boolean);

    return parts.length ? parts.join(', ') : '—';
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
  }
}
