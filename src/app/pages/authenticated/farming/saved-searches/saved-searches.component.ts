import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  SAVED_SEARCHES_DEFAULT_PAGE_SIZE,
  SAVED_SEARCHES_EMPTY_COPY,
  SAVED_SEARCHES_FILTER_FIELD_OPTIONS,
  SAVED_SEARCHES_PAGE_SIZE_OPTIONS
} from '@app/features/farming/config/saved-searches.config';
import { AuthService } from '@app/core/services/auth.service';
import { SavedSearchesService } from '@app/features/farming/services/saved-searches.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { VerticalService } from '@app/core/services/vertical.service';

@Component({
  selector: 'app-saved-searches',
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
  templateUrl: './saved-searches.component.html'
})
export class SavedSearchesComponent {
  @ViewChild('deleteConfirmModal') private deleteConfirmModal?: ModalComponent;
  @ViewChild('renameModal') private renameModal?: ModalComponent;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly savedSearchesService = inject(SavedSearchesService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly verticalService = inject(VerticalService);
  readonly columns = this.savedSearchesService.columns;
  readonly rows = this.savedSearchesService.rows;
  readonly loading = this.savedSearchesService.loading;
  readonly error = this.savedSearchesService.error;
  readonly searchText = this.savedSearchesService.searchText;
  readonly searchField = this.savedSearchesService.searchField;
  readonly filterFieldOptions = SAVED_SEARCHES_FILTER_FIELD_OPTIONS;

  readonly pipelineConfig = {
    defaultViewMode: 'list' as const,
    viewModes: ['list'] as MapPipelineViewMode[]
  };
  readonly pageSize = SAVED_SEARCHES_DEFAULT_PAGE_SIZE;
  readonly pageSizeOptions = SAVED_SEARCHES_PAGE_SIZE_OPTIONS;

  readonly emptyTitle = computed(() => SAVED_SEARCHES_EMPTY_COPY.title);
  readonly emptyDescription = computed(() => {
    if (this.savedSearchesService.hasActiveFilters()) {
      return 'No saved searches match your current filters. Try a different search or clear filters.';
    }

    return SAVED_SEARCHES_EMPTY_COPY.description;
  });

  readonly hasActiveFilters = computed(() => {
    this.searchText();
    this.searchField();
    return this.savedSearchesService.hasActiveFilters();
  });

  readonly filtersOpen = signal(false);
  readonly selectionMode = signal(false);
  readonly selectedQueryIds = signal<Set<string>>(new Set());
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly pendingDeleteIds = signal<string[]>([]);
  readonly actionNotice = signal<string | null>(null);

  readonly renaming = signal(false);
  readonly renameError = signal<string | null>(null);
  readonly pendingRenameQueryId = signal<string | null>(null);
  readonly renameName = signal('');

  readonly selectedCount = computed(() => this.selectedQueryIds().size);
  readonly hasSelection = computed(() => this.selectedCount() > 0);
  readonly pendingDeleteCount = computed(() => this.pendingDeleteIds().length);
  readonly deleteConfirmTitle = computed(() =>
    this.pendingDeleteCount() === 1 ? 'Delete saved search?' : `Delete ${this.pendingDeleteCount()} saved searches?`
  );

  constructor() {
    effect(() => {
      if (this.authService.getUserId() != null) {
        this.sessionExpiredService.sessionRenewed();
        untracked(() => this.savedSearchesService.fetchList());
      }
    });

    effect(() => {
      this.verticalService.content();
      untracked(() => this.savedSearchesService.reapplyRowActions());
    });
  }

  refreshList(): void {
    this.savedSearchesService.refresh();
  }

  onSearchInput(event: Event): void {
    this.savedSearchesService.setSearchText((event.target as HTMLInputElement).value);
  }

  onSearchFieldChange(value: string): void {
    this.savedSearchesService.setSearchField(value);
  }

  clearSearch(): void {
    this.savedSearchesService.clearSearch();
  }

  toggleFilters(event: Event): void {
    this.filtersOpen.update((open) => !open);
    (event.currentTarget as HTMLButtonElement).blur();
  }

  onRowAction(event: { actionId: string; row: Record<string, unknown> }): void {
    const queryId = this.resolveQueryId(event.row);
    if (!queryId) {
      return;
    }

    switch (event.actionId) {
      case 'select':
        void this.router.navigate(['/farming/area-search'], { queryParams: { queryId } });
        break;
      case 'rename':
        this.openRenameModal(queryId, String(event.row['name'] ?? ''));
        break;
      case 'share':
        this.showActionNotice('Sharing saved searches will be available in a future update.');
        break;
      case 'delete':
        this.openDeleteConfirm([queryId]);
        break;
      case 'dynamic-data':
        this.showActionNotice('Dynamic Data will be available in a future update.');
        break;
    }
  }

  onSelectionChange(event: { rowId: string; selected: boolean }): void {
    this.selectedQueryIds.update((current) => {
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
    this.selectedQueryIds.update((current) => {
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
    this.selectedQueryIds.set(new Set());
  }

  exitSelectionMode(): void {
    this.selectionMode.set(false);
    this.selectedQueryIds.set(new Set());
  }

  deleteSelected(): void {
    const ids = [...this.selectedQueryIds()];
    if (!ids.length) {
      return;
    }

    this.openDeleteConfirm(ids);
  }

  openDeleteConfirm(queryIds: string[]): void {
    this.deleteError.set(null);
    this.pendingDeleteIds.set(queryIds);
    this.deleteConfirmModal?.open();
  }

  closeDeleteConfirm(): void {
    this.pendingDeleteIds.set([]);
    this.deleteError.set(null);
    this.deleteConfirmModal?.close();
  }

  confirmDelete(): void {
    const queryIds = this.pendingDeleteIds();
    if (!queryIds.length || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.savedSearchesService.removeQueries(queryIds).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDeleteConfirm();
        this.exitSelectionMode();
        this.savedSearchesService.refresh();
      },
      error: (err: Error) => {
        this.deleting.set(false);
        this.deleteError.set(err.message ?? 'Failed to delete saved search(es).');
      }
    });
  }

  openRenameModal(queryId: string, currentName: string): void {
    this.renameError.set(null);
    this.pendingRenameQueryId.set(queryId);
    this.renameName.set(currentName === '—' ? '' : currentName);
    this.renameModal?.open();
  }

  closeRenameModal(): void {
    this.pendingRenameQueryId.set(null);
    this.renameName.set('');
    this.renameError.set(null);
    this.renameModal?.close();
  }

  onRenameNameInput(event: Event): void {
    this.renameName.set((event.target as HTMLInputElement).value);
  }

  confirmRename(): void {
    const queryId = this.pendingRenameQueryId();
    const newName = this.renameName().trim();
    if (!queryId || !newName || this.renaming()) {
      return;
    }

    this.renaming.set(true);
    this.renameError.set(null);

    this.savedSearchesService.renameQuery(queryId, newName).subscribe({
      next: () => {
        this.renaming.set(false);
        this.closeRenameModal();
        this.savedSearchesService.refresh();
      },
      error: (err: Error) => {
        this.renaming.set(false);
        this.renameError.set(err.message ?? 'Failed to rename saved search.');
      }
    });
  }

  private resolveQueryId(row: Record<string, unknown>): string | null {
    const id = row['queryId'] ?? row['id'];
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
