import { Injectable, inject, signal } from '@angular/core';
import { resolveAdminOfficeRowActions } from '@app/features/admin/config/admin-office-actions.config';
import { ApiService } from '@app/core/services/api.service';
import { AdminPermissionsService } from '@app/features/admin/services/admin-permissions.service';
import { TargetOfficeService } from '@app/features/dashboard/services/target-office.service';
import {
  AdminOfficePipelineResponse,
  AdminOfficeRecord,
  AdminOfficeTableBadge,
  AdminOfficeTbAddress,
  AdminOfficeTbEmail,
  AdminOfficeTbPhone
} from '@app/core/interfaces/admin-offices.interface';
import { DataTableColumn } from '@app/shared/ui/data-table/data-table.types';
import { API_CONFIG } from '@app/core/config/api.config';

export const ADMIN_OFFICES_COLUMNS: DataTableColumn[] = [
  { key: 'actions', label: '', variant: 'actions', sortable: false, align: 'center', width: 'w-12' },
  {
    key: 'nameBadges',
    label: 'Name',
    variant: 'badges',
    badgesLayout: 'stacked',
    sortable: false,
    truncate: true,
    width: 'min-w-48'
  },
  { key: 'address', label: 'Address', sortType: 'text', truncate: true, width: 'min-w-56' },
  { key: 'phone', label: 'Phone', sortType: 'text', variant: 'muted', width: 'min-w-36' },
  { key: 'email', label: 'Email', sortType: 'text', truncate: true, width: 'min-w-48' },
  {
    key: 'officeInfo',
    label: 'Office Info',
    sortType: 'text',
    variant: 'muted',
    truncate: true,
    width: 'min-w-56'
  }
];

const SEARCH_DEBOUNCE_MS = 320;

@Injectable({ providedIn: 'root' })
export class AdminOfficesService {
  private readonly apiService = inject(ApiService);
  private readonly adminPermissions = inject(AdminPermissionsService);
  private readonly targetOfficeService = inject(TargetOfficeService);

  private readonly _allRows = signal<Record<string, unknown>[]>([]);
  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalLoadedCount = signal(0);
  private readonly _searchText = signal('');
  private readonly _searchField = signal('$');

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalLoadedCount = this._totalLoadedCount.asReadonly();
  readonly searchText = this._searchText.asReadonly();
  readonly searchField = this._searchField.asReadonly();
  readonly columns = ADMIN_OFFICES_COLUMNS;

  readonly hasActiveFilters = (): boolean =>
    !!this._searchText().trim() || this._searchField() !== '$';

  private loadSucceeded = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  fetchOffices(page = 1, force = false): void {
    this.targetOfficeService.ensureDefault();

    if (!force && this.loadSucceeded) {
      this.refreshFilteredRows();
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    if (force) {
      this._allRows.set([]);
      this._rows.set([]);
      this._totalLoadedCount.set(0);
    }

    const endpoint = `${API_CONFIG.endpoints.listOffices}/page:${page}.json`;

    this.apiService.getParsedJson<AdminOfficePipelineResponse>(endpoint, { treatEmptyAs: {} }).subscribe({
      next: (response) => {
        try {
          const records = this.normalizeRecords(response);
          const mapped = records.map((record, index) => this.mapRecord(record, index));
          this._allRows.set(mapped);
          this._totalLoadedCount.set(this.extractCount(response, mapped.length));
          this.loadSucceeded = true;
          this._loading.set(false);
          this.refreshFilteredRows();
        } catch (err) {
          this.loadSucceeded = false;
          this._error.set(err instanceof Error ? err.message : 'Failed to load offices.');
          this._loading.set(false);
        }
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load offices.');
        this._loading.set(false);
      }
    });
  }

  invalidateCache(): void {
    this.loadSucceeded = false;
    this._allRows.set([]);
    this._rows.set([]);
    this._totalLoadedCount.set(0);
    this._error.set(null);
    this._loading.set(false);
    this.resetFilters(false);
  }

  setSearchText(value: string): void {
    this._searchText.set(value);
    this.scheduleFilterRefresh();
  }

  clearSearch(): void {
    this.setSearchText('');
  }

  setSearchField(value: string): void {
    this._searchField.set(value);
    this.refreshFilteredRows();
  }

  resetFilters(reapply = true): void {
    this._searchText.set('');
    this._searchField.set('$');

    if (reapply) {
      this.refreshFilteredRows();
    }
  }

  private scheduleFilterRefresh(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.refreshFilteredRows(), SEARCH_DEBOUNCE_MS);
  }

  refreshDisplay(): void {
    this.refreshFilteredRows();
  }

  private refreshFilteredRows(): void {
    const remapped = this.remapRows(this._allRows());
    this._rows.set(this.filterRowsClient(remapped));
  }

  private remapRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.map((row, index) => {
      const raw = row['raw'] as AdminOfficeRecord | undefined;
      return raw ? this.mapRecord(raw, index) : row;
    });
  }

  private filterRowsClient(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.filter((row) => this.matchesClientFilters(row));
  }

  private matchesClientFilters(row: Record<string, unknown>): boolean {
    const query = this._searchText().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const field = this._searchField();
    const searchableByField = row['searchableByField'] as Record<string, string> | undefined;
    if (!searchableByField) {
      return false;
    }

    if (field === '$') {
      return Object.values(searchableByField).some((value) => value.includes(query));
    }

    return (searchableByField[field] ?? '').includes(query);
  }

  private normalizeRecords(response: AdminOfficePipelineResponse): AdminOfficeRecord[] {
    const envelope = response.response;

    if (envelope?.status === 'ERROR') {
      throw new Error(envelope.message ?? 'Failed to load offices.');
    }

    const records = envelope?.data?.object;
    if (!records) {
      return [];
    }

    return Array.isArray(records) ? records : Object.values(records);
  }

  private extractCount(response: AdminOfficePipelineResponse, fallback: number): number {
    const count = response.response?.data?.count;
    return count != null ? Number(count) : fallback;
  }

  private mapRecord(record: AdminOfficeRecord, index: number): Record<string, unknown> {
    const office = record.TbOffice ?? {};
    const name = office.corporate_name?.trim() || '—';
    const address = this.formatAddress(record.TbAddress);
    const phone = this.formatPhone(record.TbPhone);
    const email = this.formatEmail(record.TbEmail);
    const officeInfo = this.formatOfficeInfo(office);
    const nameBadges = this.buildNameBadges(name, office);

    return {
      id: office.office_id ?? index,
      actions: resolveAdminOfficeRowActions(record, {
        isAgenciesTabAllowed: this.adminPermissions.isAgenciesTabAllowed()
      }),
      name,
      nameBadges,
      address,
      phone,
      email,
      officeInfo,
      searchableByField: {
        name: name.toLowerCase(),
        address: address.toLowerCase(),
        phone: phone.toLowerCase(),
        email: email.toLowerCase(),
        officeInfo: officeInfo.toLowerCase()
      },
      raw: record
    };
  }

  private buildNameBadges(
    name: string,
    office: AdminOfficeRecord['TbOffice']
  ): AdminOfficeTableBadge[] {
    const badges: AdminOfficeTableBadge[] = [{ label: name, display: 'text' }];
    const targetOfficeId = this.targetOfficeService.getTargetOfficeId();
    if (
      targetOfficeId != null &&
      office?.office_id != null &&
      String(targetOfficeId) === String(office.office_id)
    ) {
      badges.push({ label: 'Target Office', tone: 'warning' });
    }

    return badges;
  }

  private formatAddress(value?: AdminOfficeTbAddress | AdminOfficeTbAddress[]): string {
    const address = this.firstItem(value);
    if (!address) {
      return '—';
    }

    const parts = [address.address, address.city, address.state, address.zip]
      .map((part) => (part == null ? '' : String(part).trim()))
      .filter(Boolean);

    return parts.length ? parts.join(', ') : '—';
  }

  private formatPhone(value?: AdminOfficeTbPhone | AdminOfficeTbPhone[]): string {
    const phone = this.firstItem(value)?.phone;
    return phone?.trim() || '—';
  }

  private formatEmail(value?: AdminOfficeTbEmail | AdminOfficeTbEmail[]): string {
    const email = this.firstItem(value)?.email;
    return email?.trim() || '—';
  }

  private formatOfficeInfo(office: AdminOfficeRecord['TbOffice']): string {
    if (!office) {
      return '—';
    }

    const parts = [
      office.dba?.trim(),
      office.lic_number ? `License: ${office.lic_number}` : 'License: none',
      office.created_date ? `Created: ${this.formatDate(office.created_date)}` : null
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : '—';
  }

  private formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString();
  }

  private firstItem<T>(value?: T | T[]): T | undefined {
    if (value == null) {
      return undefined;
    }

    return Array.isArray(value) ? value[0] : value;
  }
}
