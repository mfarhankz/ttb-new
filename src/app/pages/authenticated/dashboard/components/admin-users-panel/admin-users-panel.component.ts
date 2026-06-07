import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  untracked,
  OnDestroy,
  TemplateRef,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
  AdminUserToolbarActionId,
  getAdminUserToolbarActions
} from '@app/core/config/admin/admin-user-toolbar.config';
import { AdminPermissionsService } from '@app/core/services/admin-permissions.service';
import { AdminUsersService } from '@app/core/services/admin-users.service';
import { DashboardTabToolbarService } from '@app/core/services/dashboard-tab-toolbar.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';

@Component({
  selector: 'app-admin-users-panel',
  standalone: true,
  imports: [DataTableComponent, FormsModule, IconField, InputIcon, InputText, Select, ToggleSwitch],
  templateUrl: './admin-users-panel.component.html'
})
export class AdminUsersPanelComponent implements AfterViewInit, OnDestroy {
  private readonly adminUsersService = inject(AdminUsersService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly verticalService = inject(VerticalService);
  private readonly adminPermissions = inject(AdminPermissionsService);
  private readonly tabToolbar = inject(DashboardTabToolbarService);

  private readonly usersFilterPanel = viewChild.required<TemplateRef<unknown>>('usersFilterPanel');

  readonly columns = this.adminUsersService.columns;
  readonly rows = this.adminUsersService.rows;
  readonly loading = this.adminUsersService.loading;
  readonly searching = this.adminUsersService.searching;
  readonly error = this.adminUsersService.error;
  readonly searchText = this.adminUsersService.searchText;
  readonly userTypeFilter = this.adminUsersService.userTypeFilter;
  readonly includeInactive = this.adminUsersService.includeInactive;
  readonly userTypeOptions = this.adminUsersService.userTypeOptions;
  readonly totalLoadedCount = this.adminUsersService.totalLoadedCount;

  readonly hasActiveFilters = computed(() => this.adminUsersService.hasActiveFilters());

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

  readonly toolbarMenuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    this.toolbarActions().forEach((action) => {
      if (action.id === 'reset-default') {
        items.push({ separator: true });
      }

      items.push({
        label: action.label,
        icon: action.icon,
        disabled: this.isToolbarActionDisabled(action.id),
        styleClass: action.variant === 'danger' ? 'text-danger' : undefined,
        command: () => this.onToolbarAction(action.id)
      });
    });

    return items;
  });

  readonly userLimitHint = computed(() =>
    this.totalLoadedCount() > 100
      ? 'Up to 100 of the most recently added users are shown below'
      : null
  );

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
      untracked(() => this.adminUsersService.fetchUsers());
    });
  }

  ngAfterViewInit(): void {
    this.tabToolbar.register({
      menuItems: this.toolbarMenuItems,
      hasActiveFilters: this.hasActiveFilters,
      filterPanel: this.usersFilterPanel(),
      hint: this.userLimitHint
    });
  }

  ngOnDestroy(): void {
    this.tabToolbar.unregister();
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

  isToolbarActionDisabled(actionId: AdminUserToolbarActionId): boolean {
    return this.loading() || (actionId !== 'reset-default' && this.rows().length === 0);
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
