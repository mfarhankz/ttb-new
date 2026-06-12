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
import { MultiSelect } from 'primeng/multiselect';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchControlStyles } from './area-search-control.styles';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';
import { resolveChoiceTreeDefaultValue } from '@app/core/utils/area-search-field-meta.util';
import {
  AreaSearchTreeOptionGroup,
  areaSearchFieldLabelId,
  mapTreeChoiceGroups
} from './area-search-field.utils';

@Component({
  selector: 'app-area-search-choice-tree-field',
  standalone: true,
  imports: [FormsModule, MultiSelect, AreaSearchFieldLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-0.5">
      <app-area-search-field-label [label]="field.label" [labelId]="fieldLabelId" />
      <p-multiselect
        [ariaLabelledBy]="fieldLabelId"
        [inputId]="field.field_name"
        [group]="true"
        [options]="optionGroups()"
        optionGroupLabel="label"
        optionGroupChildren="items"
        optionLabel="label"
        optionValue="value"
        [ngModel]="selectedValues()"
        (ngModelChange)="onValueChange($event)"
        [filter]="false"
        [showToggleAll]="false"
        [showHeader]="false"
        [highlightOnSelect]="true"
        display="chip"
        [maxSelectedLabels]="100"
        placeholder="Select"
        scrollHeight="250px"
        [panelStyleClass]="controlStyles.treeMultiSelectPanel"
        [chipIcon]="controlStyles.chipRemoveIcon"
        [class]="controlStyles.treeMultiSelect"
      >
        <ng-template #group let-group>
          <span class="text-xs font-semibold uppercase text-subtle">{{ group.label }}</span>
        </ng-template>
      </p-multiselect>
    </div>
  `
})
export class AreaSearchChoiceTreeFieldComponent implements OnChanges {
  protected readonly controlStyles = AreaSearchControlStyles;

  get fieldLabelId(): string {
    return areaSearchFieldLabelId(this.field.field_name);
  }
  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  readonly optionGroups = signal<AreaSearchTreeOptionGroup[]>([]);
  private readonly emptySelection: string[] = [];
  readonly selectedValues = signal<string[]>(this.emptySelection);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.optionGroups.set(mapTreeChoiceGroups(this.field));
    }

    if (changes['field'] || changes['value']) {
      this.syncSelectedValues();
    }
  }

  onValueChange(next: string[]): void {
    const normalized = next ?? [];

    if (this.arraysEqual(normalized, this.selectedValues())) {
      return;
    }

    this.selectedValues.set(normalized.length ? [...normalized] : this.emptySelection);
    this.valueChange.emit({
      search_type: 'CT',
      value: normalized.length ? normalized : undefined
    });
  }

  private syncSelectedValues(): void {
    const raw = this.value?.value;
    let next = Array.isArray(raw) ? raw.map(String) : [];

    if (!next.length) {
      next = resolveChoiceTreeDefaultValue(this.field.default_value) ?? [];
    }

    if (this.arraysEqual(next, this.selectedValues())) {
      return;
    }

    this.selectedValues.set(next.length ? [...next] : this.emptySelection);
  }

  private arraysEqual(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }
}
