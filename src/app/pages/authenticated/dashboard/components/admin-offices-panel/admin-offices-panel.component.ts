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
import { OFFICE_FILTER_FIELD_OPTIONS } from '@app/core/config/admin/admin-office-filters.config';
import {
  AdminOfficeToolbarActionId,
  getAdminOfficeToolbarActions
} from '@app/core/config/admin/admin-office-toolbar.config';
import { AdminPermissionsService } from '@app/core/services/admin-permissions.service';
import { AdminOfficeRecord } from '@app/core/interfaces/admin-offices.interface';
import { AdminOfficesService } from '@app/core/services/admin-offices.service';
import { TargetOfficeService } from '@app/core/services/target-office.service';
import { DashboardTabToolbarService } from '@app/core/services/dashboard-tab-toolbar.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';

@Component({
  selector: 'app-admin-offices-panel',
  standalone: true,
  imports: [DataTableComponent, FormsModule, IconField, InputIcon, InputText, Select],
  templateUrl: './admin-offices-panel.component.html'
})
export class AdminOfficesPanelComponent implements AfterViewInit, OnDestroy {
  private readonly adminOfficesService = inject(AdminOfficesService);
  private readonly targetOfficeService = inject(TargetOfficeService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly adminPermissions = inject(AdminPermissionsService);
  private readonly tabToolbar = inject(DashboardTabToolbarService);

  private readonly officesFilterPanel = viewChild.required<TemplateRef<unknown>>('officesFilterPanel');

  readonly searchFieldOptions = OFFICE_FILTER_FIELD_OPTIONS;
  readonly columns = this.adminOfficesService.columns;
  readonly rows = this.adminOfficesService.rows;
  readonly loading = this.adminOfficesService.loading;
  readonly error = this.adminOfficesService.error;
  readonly searchText = this.adminOfficesService.searchText;
  readonly searchField = this.adminOfficesService.searchField;

  readonly entityLabel = computed<'Office' | 'Agency'>(() =>
    this.adminPermissions.isAgenciesTabAllowed() ? 'Agency' : 'Office'
  );

  readonly toolbarActions = computed(() => getAdminOfficeToolbarActions(this.entityLabel()));

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

  readonly hasActiveFilters = computed(() => this.adminOfficesService.hasActiveFilters());

  readonly emptyTitle = computed(() => `No ${this.entityLabel().toLowerCase()}s found`);

  readonly emptyDescription = computed(() =>
    this.hasActiveFilters()
      ? `No ${this.entityLabel().toLowerCase()}s match your current filters. Try a different search or reset filters.`
      : `${this.entityLabel()}s will appear here once they are added.`
  );

  constructor() {
    effect(() => {
      this.sessionExpiredService.sessionRenewed();
      untracked(() => this.adminOfficesService.fetchOffices());
    });
  }

  ngAfterViewInit(): void {
    this.tabToolbar.register({
      menuItems: this.toolbarMenuItems,
      hasActiveFilters: this.hasActiveFilters,
      filterPanel: this.officesFilterPanel()
    });
  }

  ngOnDestroy(): void {
    this.tabToolbar.unregister();
  }

  resetDefault(): void {
    this.adminOfficesService.resetFilters();
    this.adminOfficesService.fetchOffices(1, true);
  }

  clearSearch(): void {
    this.adminOfficesService.clearSearch();
  }

  onSearchInput(event: Event): void {
    this.adminOfficesService.setSearchText((event.target as HTMLInputElement).value);
  }

  onSearchFieldChange(value: string): void {
    this.adminOfficesService.setSearchField(value);
  }

  isToolbarActionDisabled(actionId: AdminOfficeToolbarActionId): boolean {
    return this.loading();
  }

  onToolbarAction(actionId: AdminOfficeToolbarActionId): void {
    if (actionId === 'reset-default') {
      this.resetDefault();
      return;
    }

    // Add/edit office, advanced search, and upload flows will be wired in follow-up work.
  }

  onRowAction(event: { actionId: string; row: Record<string, unknown> }): void {
    if (event.actionId !== 'set-target-office') {
      return;
    }

    const record = event.row['raw'] as AdminOfficeRecord | undefined;
    const office = record?.TbOffice;
    if (office?.office_id == null) {
      return;
    }

    this.targetOfficeService.setTargetOffice(
      office.office_id,
      office.corporate_name?.trim() || 'Office'
    );
    this.adminOfficesService.refreshDisplay();
  }
}
