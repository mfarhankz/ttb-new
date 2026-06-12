import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  NET_SHEET_DEFAULT_LABELS,
  NET_SHEET_LOAN_TYPES,
  NET_SHEET_TABS
} from '../config/net-sheet.config';
import {
  NetSheetData,
  NetSheetFetchPayload,
  NetSheetParsedMeta,
  NetSheetSaveResult,
  NetSheetSaveTabPayload,
  NetSheetTabId,
  NetSheetVariableFeesPayload,
  TtbNetSheetResponse,
  TtbNetSheetSaveResponse,
  TtbNetSheetVariableFeesResponse
} from '../interfaces/net-sheet.interface';
import { netSheetToFixed } from '../utils/net-sheet.util';
import { ApiService } from './api.service';
import { VerticalService } from './vertical.service';

@Injectable({ providedIn: 'root' })
export class NetSheetService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly verticalService = inject(VerticalService);

  fetchNetSheet(payload: NetSheetFetchPayload): Observable<NetSheetData> {
    return this.apiService.post<TtbNetSheetResponse>(API_CONFIG.endpoints.getNetsheet, payload).pipe(
      map((response) => {
        const envelope = response.response;
        if (envelope.status !== 'OK' || !envelope.data) {
          throw new Error(this.coalesceErrorMessage(envelope.data) || 'Failed to load net sheet.');
        }

        return this.normalizeFetchedData(envelope.data);
      })
    );
  }

  fetchVariableFees(
    payload: NetSheetVariableFeesPayload
  ): Observable<Record<string, number | string>> {
    return this.apiService
      .post<TtbNetSheetVariableFeesResponse>(API_CONFIG.endpoints.getNetsheetVariableFees, payload)
      .pipe(
        map((response) => {
          const envelope = response.response;
          if (envelope.status !== 'OK') {
            throw new Error(this.coalesceErrorMessage(envelope.data) || 'Failed to load fee fields.');
          }

          const fees = envelope.data?.fees?.[payload.netsheet_type];
          return fees ?? {};
        })
      );
  }

  saveNetSheetTab(payload: NetSheetSaveTabPayload): Observable<NetSheetSaveResult> {
    return this.apiService.post<TtbNetSheetSaveResponse>(API_CONFIG.endpoints.saveNetsheet, payload).pipe(
      map((response) => {
        const envelope = response.response;
        if (envelope.status !== 'OK') {
          throw new Error(this.coalesceErrorMessage(envelope.data) || 'Failed to save net sheet.');
        }

        const data = envelope.data;
        if (Array.isArray(data)) {
          return { msg: data.join(', ') };
        }

        return data ?? {};
      })
    );
  }

  printNetSheetPdf(payload: NetSheetSaveTabPayload): Observable<string> {
    const baseUrl = this.verticalService.initialized()
      ? this.verticalService.apiBaseUrl()
      : API_CONFIG.baseUrl;
    const url = `${baseUrl}${API_CONFIG.endpoints.getNetsheetPdf}?output_type=link`;

    return this.http.post(url, payload, { responseType: 'text' }).pipe(
      map((link) => {
        const trimmed = link?.trim();
        if (!trimmed) {
          throw new Error('PDF link was not returned.');
        }

        return trimmed;
      })
    );
  }

  normalizeFetchedData(raw: NetSheetData): NetSheetData {
    const data = structuredClone(raw) as NetSheetData;
    const flatLabels = this.buildFlatLabels(data.meta);
    const parsedMeta: NetSheetParsedMeta = {
      labels: {
        combinedSheet: {
          combinedGroup: {
            ...NET_SHEET_DEFAULT_LABELS,
            ...flatLabels
          }
        }
      }
    };

    if (data.seller && !data.net2sell) {
      data.net2sell = structuredClone(data.seller);
    }

    const closingDate = this.defaultClosingDate();

    for (const tab of NET_SHEET_TABS) {
      const tabData = data[tab] as Record<string, Record<string, unknown>> | undefined;
      if (!tabData) {
        continue;
      }

      this.ensureGroup(tabData, 'Encumbrances');
      this.ensureGroup(tabData, 'Other Expenses');
      if (tab === 'refinance' || tab === 'buyer') {
        this.ensureGroup(tabData, 'New Loan');
        this.ensureGroup(tabData, 'Prepaid');
        this.ensureGroup(tabData, 'Payment');
      }
      if (tab === 'seller' || tab === 'net2sell') {
        this.ensureGroup(tabData, 'Brokerage Fees');
      }

      const general = tabData['General Info'] ?? {};
      general['Sales Price'] = netSheetToFixed(general['Sales Price']);
      general['Current Annual Taxes'] = netSheetToFixed(general['Current Annual Taxes']);
      general['Estimated Closing Date'] = general['Estimated Closing Date'] ?? closingDate;
      general['Property Tax Prorated Date'] = general['Property Tax Prorated Date'] ?? closingDate;
      tabData['General Info'] = general;

      if (tab === 'buyer') {
        const settlement = tabData['Settlement Services'] ?? {};
        settlement['Escrow Fee Payer'] = settlement['Escrow Fee Payer'] ?? 'buyer';
        settlement['Title Insurance Policy Payer'] =
          settlement['Title Insurance Policy Payer'] ?? 'buyer';
        settlement['Lenders Title Policy Payer'] =
          settlement['Lenders Title Policy Payer'] ?? 'buyer';
        tabData['Settlement Services'] = settlement;

        const newLoan = tabData['New Loan'] ?? {};
        newLoan['First Loan Type'] = newLoan['First Loan Type'] ?? NET_SHEET_LOAN_TYPES[0].value;
        newLoan['First Loan Terms in Years'] = newLoan['First Loan Terms in Years'] ?? 30;
        tabData['New Loan'] = newLoan;
      }
    }

    data.parsedMeta = parsedMeta;
    return data;
  }

  extractTabMeta(data: NetSheetData, tab: NetSheetTabId): { tabData: Record<string, unknown>; meta: { netsheet_id?: number | string; time_saved?: string } } {
    const tabRecord = (data[tab] ?? {}) as Record<string, unknown>;
    const meta = {
      netsheet_id: tabRecord['netsheet_id'] as number | string | undefined,
      time_saved: tabRecord['time_saved'] as string | undefined
    };

    delete tabRecord['netsheet_id'];
    delete tabRecord['time_saved'];

    return { tabData: tabRecord, meta };
  }

  private buildFlatLabels(meta: Record<string, unknown> | undefined): Record<string, string> {
    if (!meta) {
      return {};
    }

    const labels: Record<string, string> = {};
    for (const [fieldName, fieldValue] of Object.entries(meta)) {
      if (fieldName === 'included_levels') {
        continue;
      }

      if (fieldValue && typeof fieldValue === 'object' && 'label' in (fieldValue as object)) {
        labels[fieldName] = String((fieldValue as { label?: string }).label ?? fieldName);
      }
    }

    return labels;
  }

  private ensureGroup(tabData: Record<string, Record<string, unknown>>, groupName: string): void {
    tabData[groupName] = tabData[groupName] ?? {};
  }

  private defaultClosingDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }

  private coalesceErrorMessage(data: unknown): string {
    if (Array.isArray(data)) {
      return data.filter(Boolean).join('<br>');
    }

    if (data && typeof data === 'object' && 'msg' in data) {
      const msg = (data as { msg?: string }).msg;
      return msg?.trim() ?? '';
    }

    return '';
  }
}
