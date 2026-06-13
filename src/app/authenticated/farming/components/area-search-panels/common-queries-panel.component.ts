import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { ButtonComponent } from '@app/shared/components';
import { CommonAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { CommonQueriesService } from '@app/authenticated/farming/services/common-queries.service';

@Component({
  selector: 'app-common-queries-panel',
  standalone: true,
  imports: [ButtonComponent, FormsModule, InputText],
  template: `
    <div class="flex flex-col gap-3">
      @if (loading()) {
        <p class="text-sm text-subtle">Loading common queries…</p>
      } @else if (error()) {
        <p class="text-sm text-danger">{{ error() }}</p>
      } @else if (!queries().length) {
        <p class="text-sm text-subtle">No common queries available.</p>
      }

      @for (query of queries(); track query.query_id) {
        <article class="rounded-md border border-border bg-surface p-3 flex flex-col gap-2">
          <h4 class="text-sm font-semibold text-foreground">{{ query.name || 'Untitled' }}</h4>
          <div class="flex flex-wrap gap-2">
            <app-button size="sm" variant="outline" (onClick)="search.emit(query)">Search</app-button>
            <app-button size="sm" variant="ghost" (onClick)="startRename(query)">Rename</app-button>
            <app-button size="sm" variant="danger" (onClick)="remove(query)">Delete</app-button>
          </div>
        </article>
      }

      @if (renamingId) {
        <div class="rounded-md border border-border p-3 flex flex-col gap-2">
          <input pInputText type="text" [(ngModel)]="renameValue" placeholder="New name" />
          <div class="flex gap-2">
            <app-button size="sm" (onClick)="confirmRename()">Save</app-button>
            <app-button size="sm" variant="ghost" (onClick)="cancelRename()">Cancel</app-button>
          </div>
        </div>
      }
    </div>
  `
})
export class CommonQueriesPanelComponent {
  private readonly commonQueriesService = inject(CommonQueriesService);

  readonly queries = this.commonQueriesService.queries;
  readonly loading = this.commonQueriesService.loading;
  readonly error = this.commonQueriesService.error;

  @Output() search = new EventEmitter<CommonAreaSearchQuery>();

  renamingId: string | number | null = null;
  renameValue = '';

  startRename(query: CommonAreaSearchQuery): void {
    this.renamingId = query.query_id ?? null;
    this.renameValue = query.name ?? '';
  }

  cancelRename(): void {
    this.renamingId = null;
    this.renameValue = '';
  }

  confirmRename(): void {
    if (!this.renamingId || !this.renameValue.trim()) {
      return;
    }

    this.commonQueriesService.renameQuery(this.renamingId, this.renameValue.trim()).subscribe({
      next: () => {
        this.cancelRename();
        this.commonQueriesService.refresh();
      }
    });
  }

  remove(query: CommonAreaSearchQuery): void {
    if (!query.query_id) {
      return;
    }

    this.commonQueriesService.removeQuery(query.query_id).subscribe({
      next: () => this.commonQueriesService.refresh()
    });
  }
}
