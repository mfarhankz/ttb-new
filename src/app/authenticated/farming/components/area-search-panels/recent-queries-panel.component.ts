import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ButtonComponent } from '@app/shared/components';
import { RecentAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { RecentQueriesService } from '@app/authenticated/farming/services/recent-queries.service';

@Component({
  selector: 'app-recent-queries-panel',
  standalone: true,
  imports: [ButtonComponent, DatePipe],
  template: `
    <div class="flex flex-col gap-3">
      @if (!queries().length) {
        <p class="text-sm text-subtle">No recent queries yet.</p>
      }
      @for (query of queries(); track query.id) {
        <article class="rounded-md border border-border bg-surface p-3 flex flex-col gap-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="text-sm font-semibold text-foreground">{{ query.name }}</h4>
              <p class="text-xs text-subtle">{{ query.modifiedAt | date: 'short' }}</p>
            </div>
            @if (query.resultCount != null) {
              <span class="text-xs text-subtle">{{ query.resultCount }} records</span>
            }
          </div>
          <div class="flex flex-wrap gap-2">
            <app-button size="sm" variant="outline" (onClick)="search.emit(query)">Search</app-button>
            <app-button size="sm" variant="ghost" (onClick)="revise.emit(query)">Revise</app-button>
            <app-button size="sm" variant="danger" (onClick)="remove(query.id)">Remove</app-button>
          </div>
        </article>
      }
    </div>
  `
})
export class RecentQueriesPanelComponent {
  private readonly recentQueriesService = inject(RecentQueriesService);

  readonly queries = this.recentQueriesService.queries;

  @Output() search = new EventEmitter<RecentAreaSearchQuery>();
  @Output() revise = new EventEmitter<RecentAreaSearchQuery>();

  remove(id: string): void {
    this.recentQueriesService.remove(id);
  }
}
