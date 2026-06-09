import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AreaSearchCriteriaChip } from '@app/core/utils/area-search-criteria.util';

@Component({
  selector: 'app-area-search-criteria-chips',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-2">
      @for (chip of chips; track chip.fieldName) {
        <span
          class="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-caption leading-5"
        >
          <span class="font-medium">{{ chip.label }}:</span>
          <span>{{ chip.displayValue }}</span>
          @if (removable) {
            <button
              type="button"
              class="inline-flex h-[1.125rem] w-[1.125rem] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-danger hover:bg-danger/10"
              (click)="remove.emit(chip.fieldName)"
              [attr.aria-label]="'Remove ' + chip.label"
            >
              <i class="pi pi-times"></i>
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
}
