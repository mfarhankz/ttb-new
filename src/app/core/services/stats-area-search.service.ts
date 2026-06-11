import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  TractRecord,
  TractStatsFormData,
  TractStatsInfo,
  TractStatsSearchResult
} from '../interfaces/statistics.interface';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StatsAreaSearchService {
  private readonly apiService = inject(ApiService);

  searchTractStats(payload: TractStatsFormData): Observable<TractStatsSearchResult> {
    return this.apiService.postParsedJson<unknown>(API_CONFIG.endpoints.tractStats, payload).pipe(
      map((response) => this.parseTractStatsResponse(response))
    );
  }

  private parseTractStatsResponse(response: unknown): TractStatsSearchResult {
    const envelope = this.extractEnvelope(response);
    if (!envelope) {
      throw new Error('Invalid tract stats response.');
    }

    if (envelope.status !== 'OK') {
      const message = this.extractErrorMessage(envelope.data);
      throw new Error(message ?? 'Tract stats search failed.');
    }

    const data = envelope.data as {
      stats?: Record<string, Record<string, unknown>>;
      general?: TractStatsInfo;
    };

    if (!data.stats || !Object.keys(data.stats).length) {
      throw new Error('No records found.');
    }

    const records = this.mapTractRecords(data.stats);
    records.sort((a, b) => Number(b.turnover_rate ?? 0) - Number(a.turnover_rate ?? 0));

    return {
      records,
      info: data.general ?? {}
    };
  }

  private mapTractRecords(stats: Record<string, Record<string, unknown>>): TractRecord[] {
    const records: TractRecord[] = [];
    let index = 0;

    for (const tractValue of Object.keys(stats)) {
      const tract = { ...stats[tractValue] } as TractRecord;
      tract.tract_value = tractValue;
      tract.serial_number = index++;

      tract.total_units = String(tract.total_units ?? '');
      tract.total_sales = String(tract.total_sales ?? '');
      tract.avg_yr_owned = String(tract.avg_yr_owned ?? '');

      tract.customTurnoverRate = tract.turnover_rate != null && tract.turnover_rate !== ''
        ? `${tract.turnover_rate}%`
        : '-';

      tract.customAvgPrice = this.formatCurrency(tract.avg_price);
      tract.customNOORatio = tract.NOO_ratio != null && tract.NOO_ratio !== '' ? `${tract.NOO_ratio}%` : '-';

      const geoValue = tract.geo as unknown;
      if (typeof geoValue === 'string') {
        tract.geo = geoValue
          .trim()
          .split(',')
          .map((item: string) => Number(item));
      }

      records.push(tract);
    }

    return records;
  }

  private formatCurrency(value: unknown): string {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return '-';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }

  private extractEnvelope(response: unknown): { status?: string; data?: unknown } | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const root = response as Record<string, unknown>;
    const envelope = (root['response'] ?? root) as Record<string, unknown>;
    if (!envelope || typeof envelope !== 'object') {
      return null;
    }

    return {
      status: String(envelope['status'] ?? ''),
      data: envelope['data']
    };
  }

  private extractErrorMessage(data: unknown): string | undefined {
    if (Array.isArray(data) && data.length) {
      const first = data[0];
      return typeof first === 'string' ? first : undefined;
    }

    if (typeof data === 'string') {
      return data;
    }

    return undefined;
  }
}
