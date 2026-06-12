import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { AreaSearchChoiceOption, AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';
import { mapFieldChoices } from './area-search-field.utils';

@Component({
  selector: 'app-area-search-checkboxes-field',
  standalone: true,
  imports: [FormsModule, Checkbox, AreaSearchFieldLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="m-0 flex min-w-0 flex-col gap-0.5 border-0 p-0">
      <app-area-search-field-label tag="legend" [label]="field.label" />
      @for (option of options(); track option.value) {
        <label class="inline-flex items-center gap-2 text-sm">
          <p-checkbox
            [binary]="false"
            [value]="option.value"
            [ngModel]="selected()"
            (ngModelChange)="onChange($event)"
          />
          <span>{{ option.label }}</span>
        </label>
      }
    </fieldset>
  `
})
export class AreaSearchCheckboxesFieldComponent implements OnChanges {
  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  readonly options = signal<AreaSearchChoiceOption[]>([]);
  private readonly emptySelection: string[] = [];
  readonly selected = signal<string[]>(this.emptySelection);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.options.set(mapFieldChoices(this.field));
    }

    if (changes['field'] || changes['value']) {
      this.syncSelected();
    }
  }

  onChange(next: string[]): void {
    const normalized = next ?? [];
    if (this.arraysEqual(normalized, this.selected())) {
      return;
    }

    this.selected.set(normalized.length ? [...normalized] : this.emptySelection);
    this.valueChange.emit({ search_type: 'CHB', value: normalized.length ? normalized : undefined });
  }

  private syncSelected(): void {
    const raw = this.value?.value;
    const next = Array.isArray(raw) ? raw.map(String) : [];

    if (this.arraysEqual(next, this.selected())) {
      return;
    }

    this.selected.set(next.length ? [...next] : this.emptySelection);
  }

  private arraysEqual(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }
}
