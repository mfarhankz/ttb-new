import { Injectable, inject, signal } from '@angular/core';
import { resolveAdminUserRowActions } from '../config/admin/admin-user-actions.config';
import { ApiService } from './api.service';
import { AdminPermissionsService } from './admin-permissions.service';
import { AuthService } from './auth.service';
import { VerticalService } from './vertical.service';
import { API_CONFIG } from '../config/api.config';
import {
  getAllowedUserTypeFilterOptions,
  getUserStatusLabel,
  getUserTypeBadgeTone,
  getUserTypeLabel,
  UserTypeFilterOption
} from '../config/user-type-labels.config';
import {
  AdminUserNameCol,
  AdminUserPipelineResponse,
  AdminUserRecord,
  AdminUserTableBadge,
  AdminUserUserCol
} from '../interfaces/admin-users.interface';
import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';
import { TargetOfficeService } from './target-office.service';

export const ADMIN_USERS_COLUMNS: DataTableColumn[] = [
  { key: 'actions', label: '', variant: 'actions', sortable: false, align: 'center', width: 'w-12' },
  { key: 'name', label: 'Name', sortType: 'text', truncate: true, width: 'min-w-48' },
  { key: 'loggedInFrom', label: 'Logged in from', sortType: 'text', variant: 'muted', width: 'min-w-36' },
  { key: 'email', label: 'Email (Username)', sortType: 'text', truncate: true, width: 'min-w-56' },
  { key: 'typeBadges', label: 'Type', variant: 'badges', sortable: false, width: 'min-w-48' }
];

const DEFAULT_PIPELINE_LIMIT = 10000;
const SEARCH_DEBOUNCE_MS = 320;

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly adminPermissions = inject(AdminPermissionsService);
  private readonly verticalService = inject(VerticalService);
  private readonly targetOfficeService = inject(TargetOfficeService);

  private readonly _allRows = signal<Record<string, unknown>[]>([]);
  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _searching = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalLoadedCount = signal(0);
  private readonly _searchText = signal('');
  private readonly _userTypeFilter = signal('$');
  private readonly _includeInactive = signal(false);

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly searching = this._searching.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalLoadedCount = this._totalLoadedCount.asReadonly();
  readonly searchText = this._searchText.asReadonly();
  readonly userTypeFilter = this._userTypeFilter.asReadonly();
  readonly includeInactive = this._includeInactive.asReadonly();
  readonly columns = ADMIN_USERS_COLUMNS;

  readonly userTypeOptions = (): UserTypeFilterOption[] => {
    const overrides = this.verticalService.content()?.app_config?.['user_types_labels'] as
      | Record<string, string>
      | undefined;
    return getAllowedUserTypeFilterOptions(Number(this.authService.tbUser()?.type ?? 0), overrides);
  };

  readonly hasActiveFilters = (): boolean =>
    !!this._searchText().trim() || this._userTypeFilter() !== '$' || this._includeInactive();

  private loadSucceeded = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private searchRequestId = 0;

  fetchUsers(page = 1, force = false): void {
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

    const endpoint = this.buildPipelineEndpoint(page);

    this.apiService.getParsedJson<AdminUserPipelineResponse>(endpoint, { treatEmptyAs: {} }).subscribe({
      next: (response) => {
        try {
          const records = this.normalizeRecords(response);
          const sorted = [...records].sort(
            (left, right) => Number(right.user_col?.users_id ?? 0) - Number(left.user_col?.users_id ?? 0)
          );

          this._allRows.set(sorted.map((record, index) => this.mapRecord(record, index)));
          this._totalLoadedCount.set(this.extractCount(response, sorted.length));
          this.loadSucceeded = true;
          this._loading.set(false);
          this.refreshFilteredRows();
        } catch (err) {
          this.loadSucceeded = false;
          this._error.set(err instanceof Error ? err.message : 'Failed to load users.');
          this._loading.set(false);
        }
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load users.');
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
    this._searching.set(false);
    this.resetFilters(false);
  }

  setSearchText(value: string): void {
    this._searchText.set(value);
    this.scheduleFilterRefresh();
  }

  clearSearch(): void {
    this.setSearchText('');
  }

  setUserTypeFilter(value: string): void {
    this._userTypeFilter.set(value);
    this.refreshFilteredRows();
  }

  setIncludeInactive(value: boolean): void {
    this._includeInactive.set(value);
    this.refreshFilteredRows();
  }

  resetFilters(reapply = true): void {
    this._searchText.set('');
    this._userTypeFilter.set('$');
    this._includeInactive.set(false);

    if (reapply) {
      this.refreshFilteredRows();
    }
  }

  private scheduleFilterRefresh(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.refreshFilteredRows(), SEARCH_DEBOUNCE_MS);
  }

  private refreshFilteredRows(): void {
    const query = this._searchText().trim();

    if (query) {
      this.searchUsersRemote(query);
      return;
    }

    this.applyClientFilters(this._allRows());
  }

  private searchUsersRemote(query: string): void {
    const requestId = ++this.searchRequestId;
    this._searching.set(true);
    this._error.set(null);

    const payload: Record<string, unknown> = {
      TbUser: {
        _name_or_email_: query,
        include_inactive: this._includeInactive()
      }
    };

    const typeFilter = this._userTypeFilter();
    if (typeFilter !== '$') {
      (payload['TbUser'] as Record<string, unknown>)['type'] = typeFilter;
    }

    let endpoint = `${API_CONFIG.endpoints.searchUserPipeline}.json`;
    const targetOfficeId = this.getTargetOfficeId();
    if (targetOfficeId != null) {
      endpoint += `?target_office_id=${encodeURIComponent(String(targetOfficeId))}`;
    }

    this.apiService
      .postParsedJson<AdminUserPipelineResponse>(endpoint, payload, { treatEmptyAs: {} })
      .subscribe({
      next: (response) => {
        if (requestId !== this.searchRequestId) {
          return;
        }

        try {
          const records = this.normalizeRecords(response);
          const mapped = records.map((record, index) => this.mapRecord(record, index));
          this._rows.set(this.filterRowsClient(mapped));
          this._searching.set(false);
        } catch (err) {
          this._searching.set(false);
          this._rows.set([]);
          this._error.set(err instanceof Error ? err.message : 'Failed to search users.');
        }
      },
      error: (err) => {
        if (requestId !== this.searchRequestId) {
          return;
        }

        this._searching.set(false);
        this._rows.set([]);
        const message = err.message ?? '';
        const isEmptyResult =
          !message ||
          /no users found/i.test(message) ||
          /not found/i.test(message);
        this._error.set(isEmptyResult ? null : message || 'Failed to search users.');
      }
    });
  }

  private applyClientFilters(rows: Record<string, unknown>[]): void {
    this._rows.set(this.filterRowsClient(rows));
    this._searching.set(false);
  }

  private filterRowsClient(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.filter((row) => this.matchesClientFilters(row));
  }

  private matchesClientFilters(row: Record<string, unknown>): boolean {
    const record = row['raw'] as AdminUserRecord | undefined;
    const nameCol = record?.name_col ?? record?.TbUser;

    if (!this._includeInactive() && String(nameCol?.status ?? '') === '2') {
      return false;
    }

    const typeFilter = this._userTypeFilter();
    if (typeFilter !== '$' && String(nameCol?.type ?? '') !== typeFilter) {
      return false;
    }

    const query = this._searchText().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const searchable = String(row['searchableText'] ?? '').toLowerCase();
    return searchable.includes(query);
  }

  private buildPipelineEndpoint(page: number): string {
    let endpoint = `${API_CONFIG.endpoints.userPipeline}/page:${page}/limit:${DEFAULT_PIPELINE_LIMIT}.json`;
    const targetOfficeId = this.getTargetOfficeId();

    if (targetOfficeId != null) {
      endpoint += `?target_office_id=${encodeURIComponent(String(targetOfficeId))}`;
    }

    return endpoint;
  }

  private getTargetOfficeId(): number | string | null {
    return this.targetOfficeService.getTargetOfficeId();
  }

  private normalizeRecords(response: AdminUserPipelineResponse): AdminUserRecord[] {
    const envelope = response.response;

    if (envelope?.status === 'ERROR') {
      throw new Error(envelope.message ?? 'Failed to load users.');
    }

    const payload = envelope?.data;
    const records = payload?.data;

    if (!records) {
      return [];
    }

    return Array.isArray(records) ? records : Object.values(records);
  }

  private extractCount(response: AdminUserPipelineResponse, fallback: number): number {
    const count = response.response?.data?.count;
    return count != null ? Number(count) : fallback;
  }

  private mapRecord(record: AdminUserRecord, index: number): Record<string, unknown> {
    const nameCol = record.name_col ?? record.TbUser;
    const userCol = record.user_col ?? {};
    const userId = userCol.users_id ?? record.TbUser?.users_id ?? index;
    const name = this.formatName(nameCol);
    const email = this.formatEmail(record, userCol);

    return {
      id: userId,
      actions: resolveAdminUserRowActions(record, this.buildActionContext()),
      name,
      loggedInFrom: this.formatLoggedInFrom(userCol.reboconnect_partner_keys),
      email,
      typeBadges: this.buildTypeBadges(nameCol, userCol),
      searchableText: this.buildSearchableText(record, nameCol, userCol, name, email),
      raw: record
    };
  }

  private buildSearchableText(
    record: AdminUserRecord,
    nameCol: AdminUserNameCol | undefined,
    userCol: AdminUserUserCol,
    name: string,
    email: string
  ): string {
    const parts = [
      name,
      email,
      nameCol?.full_name,
      nameCol?.first_name,
      nameCol?.last_name,
      userCol.username,
      record.TbUser?.username,
      record.email_col?.[0]?.email,
      record.TbEmail?.[0]?.email
    ];

    return parts
      .map((part) => (part == null ? '' : String(part).trim()))
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private formatName(nameCol?: AdminUserNameCol): string {
    if (!nameCol) {
      return '—';
    }

    if (nameCol.full_name?.trim()) {
      return nameCol.full_name.trim();
    }

    const parts = [nameCol.first_name, nameCol.last_name].map((part) => (part == null ? '' : String(part).trim())).filter(Boolean);
    return parts.length ? parts.join(' ') : '—';
  }

  private formatEmail(record: AdminUserRecord, userCol: AdminUserUserCol): string {
    if (userCol.username?.trim()) {
      return userCol.username.trim();
    }

    const fromEmailCol = record.email_col?.[0]?.email ?? record.TbEmail?.[0]?.email;
    return fromEmailCol?.trim() || '—';
  }

  private formatLoggedInFrom(partnerKeys?: string[]): string {
    if (!partnerKeys?.length) {
      return '—';
    }

    return partnerKeys.join(', ');
  }

  private buildTypeBadges(
    nameCol: AdminUserNameCol | undefined,
    userCol: AdminUserUserCol
  ): AdminUserTableBadge[] {
    const badges: AdminUserTableBadge[] = [];
    const typeOverrides = this.verticalService.content()?.app_config?.['user_types_labels'] as
      | Record<string, string>
      | undefined;

    if (nameCol?.type != null && nameCol.type !== '') {
      badges.push({
        label: nameCol.user_type_label ?? getUserTypeLabel(nameCol.type, typeOverrides),
        tone: getUserTypeBadgeTone(nameCol.type)
      });
    }

    const assignment = this.getAssignmentLabel(nameCol, userCol);
    if (assignment) {
      badges.push({ label: assignment, tone: 'assignment' });
    }

    const statusLabel = getUserStatusLabel(nameCol?.status);
    if (statusLabel) {
      badges.push({ label: statusLabel, tone: 'status' });
    }

    return badges;
  }

  private buildActionContext() {
    const appConfig = (this.verticalService.content()?.app_config ?? {}) as Record<string, unknown>;

    return {
      loggedInUserType: Number(this.authService.tbUser()?.type ?? 0),
      loggedInUserId: this.authService.getUserId(),
      isOfficeTabAllowed: this.adminPermissions.officeAssociationAllowed(),
      isInvestorsVertical: this.verticalService.verticalName() === 'investors',
      appConfig
    };
  }

  private getAssignmentLabel(
    nameCol: AdminUserNameCol | undefined,
    userCol: AdminUserUserCol
  ): string | null {
    const type = Number(nameCol?.type ?? 0);

    if (type > 2) {
      return null;
    }

    if (Number(userCol.is_assigned) !== 1) {
      return 'Unassigned';
    }

    const currentUserId = this.authService.getUserId();
    if (currentUserId != null && String(userCol.parent_user_id) === String(currentUserId)) {
      return 'Assigned to me';
    }

    return null;
  }
}
