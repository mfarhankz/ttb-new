import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonComponent } from '@app/shared/components';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { DataTableComponent } from '@app/shared/ui/data-table/data-table.component';
import { MapTablePipelineComponent } from '@app/features/map/components/map-table-pipeline/map-table-pipeline.component';
import { MapPipelineViewMode } from '@app/features/map/components/map-table-pipeline/map-table-pipeline.types';
import {
  SAVED_NET_SHEETS_DEFAULT_PAGE_SIZE,
  SAVED_NET_SHEETS_EMPTY_COPY,
  SAVED_NET_SHEETS_FILTER_FIELD_OPTIONS,
  SAVED_NET_SHEETS_PAGE_SIZE_OPTIONS
} from '@app/features/farming/config/saved-net-sheets.config';
import { AuthService } from '@app/core/services/auth.service';
import { SavedNetSheetsService } from '@app/features/farming/services/saved-net-sheets.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { NetSheetModalService } from '@app/features/net-sheet/services/net-sheet-modal.service';
import { isMockBlankPropertyId, mapNetsheetTypeToTab } from '@app/core/utils/net-sheet.util';

@Component({
  selector: 'app-saved-net-sheets',
  standalone: true,
  imports: [
    MapTablePipelineComponent,
    DataTableComponent,
    ButtonComponent,
    ModalComponent,
    FormsModule,
    IconField,
    InputIcon,
    InputText,
    Select
  ],
  templateUrl: './saved-net-sheets.component.html'
})
export class SavedNetSheetsComponent {
  @ViewChild('deleteConfirmModal') private deleteConfirmModal?: ModalComponent;

  private readonly authService = inject(AuthService);
  private readonly savedNetSheetsService = inject(SavedNetSheetsService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly verticalService = inject(VerticalService);
  private readonly router = inject(Router);
  private readonly netSheetModalService = inject(NetSheetModalService);

  readonly columns = this.savedNetSheetsService.columns;
  readonly rows = this.savedNetSheetsService.rows;
  readonly loading = this.savedNetSheetsService.loading;
  readonly error = this.savedNetSheetsService.error;
  readonly searchText = this.savedNetSheetsService.searchText;
  readonly searchField = this.savedNetSheetsService.searchField;
  readonly filterFieldOptions = SAVED_NET_SHEETS_FILTER_FIELD_OPTIONS;

  readonly pipelineConfig = {
    defaultViewMode: 'list' as const,
    viewModes: ['list'] as MapPipelineViewMode[]
  };
  readonly pageSize = SAVED_NET_SHEETS_DEFAULT_PAGE_SIZE;
  readonly pageSizeOptions = SAVED_NET_SHEETS_PAGE_SIZE_OPTIONS;

  readonly emptyTitle = computed(() => SAVED_NET_SHEETS_EMPTY_COPY.title);
  readonly emptyDescription = computed(() => {
    if (this.savedNetSheetsService.hasActiveFilters()) {
      return 'No saved net sheets match your current filters. Try a different search or clear filters.';
    }

    return SAVED_NET_SHEETS_EMPTY_COPY.description;
  });

  readonly hasActiveFilters = computed(() => {
    this.searchText();
    this.searchField();
    return this.savedNetSheetsService.hasActiveFilters();
  });

  readonly filtersOpen = signal(false);
  readonly selectionMode = signal(false);
  readonly selectedNetsheetIds = signal<Set<string>>(new Set());
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly pendingDeleteIds = signal<string[]>([]);
  readonly actionNotice = signal<string | null>(null);

  readonly selectedCount = computed(() => this.selectedNetsheetIds().size);
  readonly hasSelection = computed(() => this.selectedCount() > 0);
  readonly pendingDeleteCount = computed(() => this.pendingDeleteIds().length);
  readonly deleteConfirmTitle = computed(() =>
    this.pendingDeleteCount() === 1 ? 'Delete net sheet?' : `Delete ${this.pendingDeleteCount()} net sheets?`
  );

  constructor() {
    effect(() => {
      const netsheetSupported = this.verticalService.content()?.app_config?.['netsheet_support'] !== false;
      if (!netsheetSupported) {
        untracked(() => this.router.navigate(['/farming/saved-farms']));
        return;
      }

      if (this.authService.getUserId() != null) {
        this.sessionExpiredService.sessionRenewed();
        untracked(() => this.savedNetSheetsService.fetchList());
      }
    });
  }

  refreshList(): void {
    this.savedNetSheetsService.refresh();
  }

  onSearchInput(event: Event): void {
    this.savedNetSheetsService.setSearchText((event.target as HTMLInputElement).value);
  }

  onSearchFieldChange(value: string): void {
    this.savedNetSheetsService.setSearchField(value);
  }

  clearSearch(): void {
    this.savedNetSheetsService.clearSearch();
  }

  toggleFilters(event: Event): void {
    this.filtersOpen.update((open) => !open);
    (event.currentTarget as HTMLButtonElement).blur();
  }

  onRowAction(event: { actionId: string; row: Record<string, unknown> }): void {
    const netsheetId = this.resolveNetsheetId(event.row);
    if (!netsheetId) {
      return;
    }

    switch (event.actionId) {
      case 'open': {
        const propertyId = String(event.row['propertyId'] ?? '');
        if (!propertyId) {
          return;
        }

        this.netSheetModalService.open({
          isBlankMode: isMockBlankPropertyId(propertyId),
          savedMode: true,
          propertyId,
          netSheetId: String(netsheetId),
          propertyAddress: String(event.row['propertyAddress'] ?? ''),
          activeTabFieldName: mapNetsheetTypeToTab(String(event.row['netsheetType'] ?? '')),
          preparedByName: this.authService.getUserName() ?? undefined
        });
        break;
      }
      case 'delete':
        this.openDeleteConfirm([netsheetId]);
        break;
    }
  }

  onSelectionChange(event: { rowId: string; selected: boolean }): void {
    this.selectedNetsheetIds.update((current) => {
      const next = new Set(current);
      if (event.selected) {
        next.add(event.rowId);
      } else {
        next.delete(event.rowId);
      }
      return next;
    });
  }

  onSelectAllChange(event: { rowIds: string[]; selected: boolean }): void {
    this.selectedNetsheetIds.update((current) => {
      const next = new Set(current);
      event.rowIds.forEach((rowId) => {
        if (event.selected) {
          next.add(rowId);
        } else {
          next.delete(rowId);
        }
      });
      return next;
    });
  }

  enterSelectionMode(): void {
    this.selectionMode.set(true);
    this.selectedNetsheetIds.set(new Set());
  }

  exitSelectionMode(): void {
    this.selectionMode.set(false);
    this.selectedNetsheetIds.set(new Set());
  }

  deleteSelected(): void {
    const ids = [...this.selectedNetsheetIds()];
    if (!ids.length) {
      return;
    }

    this.openDeleteConfirm(ids);
  }

  openDeleteConfirm(netsheetIds: string[]): void {
    this.deleteError.set(null);
    this.pendingDeleteIds.set(netsheetIds);
    this.deleteConfirmModal?.open();
  }

  closeDeleteConfirm(): void {
    this.pendingDeleteIds.set([]);
    this.deleteError.set(null);
    this.deleteConfirmModal?.close();
  }

  confirmDelete(): void {
    const netsheetIds = this.pendingDeleteIds();
    if (!netsheetIds.length || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.savedNetSheetsService.deleteNetsheets(netsheetIds).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteConfirm();
        this.exitSelectionMode();
        this.savedNetSheetsService.refresh();
      },
      error: (err: Error) => {
        this.deleting.set(false);
        this.deleteError.set(err.message ?? 'Failed to delete net sheet(s).');
      }
    });
  }

  private resolveNetsheetId(row: Record<string, unknown>): string | null {
    const id = row['netsheetId'] ?? row['id'];
    return id != null && id !== '' ? String(id) : null;
  }

  private showActionNotice(message: string): void {
    this.actionNotice.set(message);
    setTimeout(() => {
      if (this.actionNotice() === message) {
        this.actionNotice.set(null);
      }
    }, 4000);
  }
}
