import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
  untracked,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { PURCHASE_HISTORY_FILTER_FIELD_OPTIONS } from '@app/authenticated/dashboard/config/purchase-history-filters.config';
import { AuthService } from '@app/core/services/auth.service';
import { DashboardTabToolbarService } from '@app/authenticated/dashboard/services/dashboard-tab-toolbar.service';
import { PurchaseHistoryService } from '@app/authenticated/dashboard/services/purchase-history.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { DataTableComponent } from '@app/shared/ui/data-table/data-table.component';

@Component({
  selector: 'app-purchase-history-panel',
  standalone: true,
  imports: [DataTableComponent, FormsModule, IconField, InputIcon, InputText, Select],
  templateUrl: './purchase-history-panel.component.html'
})
export class PurchaseHistoryPanelComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly purchaseHistoryService = inject(PurchaseHistoryService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly tabToolbar = inject(DashboardTabToolbarService);

  private readonly purchaseFilterPanel = viewChild.required<TemplateRef<unknown>>('purchaseFilterPanel');

  readonly filterFieldOptions = PURCHASE_HISTORY_FILTER_FIELD_OPTIONS;
  readonly columns = this.purchaseHistoryService.columns;
  readonly rows = this.purchaseHistoryService.rows;
  readonly loading = this.purchaseHistoryService.loading;
  readonly error = this.purchaseHistoryService.error;
  readonly searchText = this.purchaseHistoryService.searchText;
  readonly searchField = this.purchaseHistoryService.searchField;

  readonly toolbarMenuItems = signal<MenuItem[]>([]);

  readonly hasActiveFilters = computed(() => this.purchaseHistoryService.hasActiveFilters());

  readonly emptyDescription = computed(() =>
    this.hasActiveFilters()
      ? 'No purchases match your current filters. Try a different search or clear filters.'
      : 'Your wallet and subscription purchases will appear here once you complete a transaction.'
  );

  constructor() {
    effect(() => {
      if (this.authService.getUserId() != null) {
        this.sessionExpiredService.sessionRenewed();
        untracked(() => this.purchaseHistoryService.fetchPurchaseHistory());
      }
    });
  }

  ngAfterViewInit(): void {
    this.tabToolbar.register({
      menuItems: this.toolbarMenuItems,
      hasActiveFilters: this.hasActiveFilters,
      filterPanel: this.purchaseFilterPanel()
    });
  }

  ngOnDestroy(): void {
    this.tabToolbar.unregister();
  }

  onSearchInput(event: Event): void {
    this.purchaseHistoryService.setSearchText((event.target as HTMLInputElement).value);
  }

  onSearchFieldChange(value: string): void {
    this.purchaseHistoryService.setSearchField(value);
  }

  clearSearch(): void {
    this.purchaseHistoryService.clearSearch();
  }
}
