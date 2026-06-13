import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AreaSearchCriteriaChip } from '@app/core/utils/area-search-criteria.util';

@Component({
  selector: 'app-area-search-criteria-chips',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-1.5">
      @for (chip of chips; track chip.fieldName) {
        <span
          class="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-surface py-1 pl-2.5 pr-1 text-caption leading-5"
        >
          <span class="shrink-0 font-medium text-subtle">{{ chip.label }}:</span>
          <span class="min-w-0 truncate text-foreground" [title]="chip.displayValue">
            {{ chip.displayValue }}
            @if (chip.viewable) {
              <button
                type="button"
                class="ml-1 cursor-pointer border-0 bg-transparent p-0 font-normal text-primary underline"
                (click)="view.emit(chip.fieldName)"
              >
                - view
              </button>
            }
          </span>
          @if (removable) {
            <button
              type="button"
              class="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-danger transition-colors hover:bg-danger/10 hover:text-danger"
              (click)="remove.emit(chip.fieldName)"
              [attr.aria-label]="'Remove ' + chip.label"
            >
              <i class="pi pi-times text-[0.65rem] leading-none"></i>
            </button>
          }
        </span>
      }
    </div>
  `
})
export class AreaSearchCriteriaChipsComponent {
  @Input({ required: true }) chips!: AreaSearchCriteriaChip[];
  @Input() removable = false;
  @Output() remove = new EventEmitter<string>();
  @Output() view = new EventEmitter<string>();
}
