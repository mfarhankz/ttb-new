import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
  AdminUserToolbarActionId,
  getAdminUserToolbarActions
} from '../../../../../core/config/admin-user-toolbar.config';
import { AdminPermissionsService } from '../../../../../core/services/admin-permissions.service';
import { AdminUsersService } from '../../../../../core/services/admin-users.service';
import { SessionExpiredService } from '../../../../../core/services/session-expired.service';
import { VerticalService } from '../../../../../core/services/vertical.service';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-admin-users-panel',
  standalone: true,
  imports: [
    ButtonComponent,
    DataTableComponent,
    FormsModule,
    IconField,
    InputIcon,
    InputText,
    Select,
    ToggleSwitch
  ],
  templateUrl: './admin-users-panel.component.html'
})
export class AdminUsersPanelComponent {
  private readonly adminUsersService = inject(AdminUsersService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly verticalService = inject(VerticalService);
  private readonly adminPermissions = inject(AdminPermissionsService);

  readonly columns = this.adminUsersService.columns;
  readonly rows = this.adminUsersService.rows;
  readonly loading = this.adminUsersService.loading;
  readonly searching = this.adminUsersService.searching;
  readonly error = this.adminUsersService.error;
  readonly searchText = this.adminUsersService.searchText;
  readonly userTypeFilter = this.adminUsersService.userTypeFilter;
  readonly includeInactive = this.adminUsersService.includeInactive;
  readonly userTypeOptions = this.adminUsersService.userTypeOptions;
  readonly hasActiveFilters = this.adminUsersService.hasActiveFilters;
  readonly totalLoadedCount = this.adminUsersService.totalLoadedCount;
  readonly filtersOpen = signal(false);

  readonly addUserAllowed = computed(
    () => !this.verticalService.content()?.app_config?.['disable_add_user']
  );

  readonly uploadUserAllowed = computed(
    () =>
      !this.adminPermissions.isOfficesVertical() || this.adminPermissions.isVerticalInAgencyMode()
  );

  readonly toolbarActions = computed(() =>
    getAdminUserToolbarActions({
      addUserAllowed: !!this.addUserAllowed(),
      uploadUserAllowed: this.uploadUserAllowed()
    })
  );

  readonly showUserLimitHint = computed(() => this.totalLoadedCount() > 100);

  readonly resultSummary = computed(() => {
    const shown = this.rows().length;
    const total = this.totalLoadedCount();
    const query = this.searchText().trim();

    if (query) {
      return shown === 1 ? '1 match found' : `${shown} matches found`;
    }

    if (this.hasActiveFilters()) {
      return `Showing ${shown} of ${total} users`;
    }

    return `${total} users`;
  });

  readonly emptyDescription = computed(() =>
    this.hasActiveFilters()
      ? 'No users match your current filters. Try a different search or reset filters.'
      : 'Users for your office or agency will appear here once they are added.'
  );

  constructor() {
    effect(() => {
      this.sessionExpiredService.sessionRenewed();
      this.adminUsersService.fetchUsers();
    });
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  resetDefault(): void {
    this.adminUsersService.resetFilters();
    this.adminUsersService.fetchUsers(1, true);
  }

  clearSearch(): void {
    this.adminUsersService.clearSearch();
  }

  onSearchInput(event: Event): void {
    this.adminUsersService.setSearchText((event.target as HTMLInputElement).value);
  }

  onUserTypeChange(value: string): void {
    this.adminUsersService.setUserTypeFilter(value);
  }

  onIncludeInactiveChange(value: boolean): void {
    this.adminUsersService.setIncludeInactive(value);
  }

  onToolbarAction(actionId: AdminUserToolbarActionId): void {
    if (actionId === 'reset-default') {
      this.resetDefault();
      return;
    }

    // Modals and handlers (add user, export, advanced search, etc.) will be wired in follow-up work.
  }

  onRowAction(_event: { actionId: string; row: Record<string, unknown> }): void {
    // Action modals (edit user, usage, limits, etc.) will be wired in follow-up work.
  }
}
