import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { AREA_SEARCH_WILDCARD_MATCH_OPTIONS } from '@app/core/config/area-search-fields.config';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { coerceTextInputValue, resolveTextMaxLength } from '@app/core/utils/area-search-field-meta.util';
import { AreaSearchControlStyles } from './area-search-control.styles';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';

@Component({
  selector: 'app-area-search-wildcard-field',
  standalone: true,
  imports: [FormsModule, InputText, Select, AreaSearchFieldLabelComponent],
  template: `
    <div class="flex flex-col gap-1.5">
      <app-area-search-field-label [label]="field.label" />

      <div class="grid grid-cols-2 gap-2">
        <p-select
          size="small"
          [inputId]="field.field_name + '_match'"
          [options]="matchOptions"
          [ngModel]="value?.match"
          (ngModelChange)="onMatchChange($event)"
          [panelStyleClass]="controlStyles.selectPanel"
          [class]="controlStyles.select"
        />

        <input
          pInputText
          [id]="field.field_name"
          type="text"
          [ngModel]="displayValue"
          (ngModelChange)="onValueChange($event)"
          [attr.maxlength]="maxLength"
          [class]="controlStyles.input"
        />
      </div>

      @if (field.note) {
        <p class="text-xs text-surface-500">{{ field.note }}</p>
      }
    </div>
  `
})
export class AreaSearchWildcardFieldComponent {
  protected readonly controlStyles = AreaSearchControlStyles;
  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  readonly matchOptions = [...AREA_SEARCH_WILDCARD_MATCH_OPTIONS];

  get maxLength(): number | null {
    return resolveTextMaxLength(this.field.validation);
  }

  get displayValue(): string {
    return coerceTextInputValue(this.value?.value);
  }

  onMatchChange(match: string): void {
    this.valueChange.emit({
      search_type: 'W',
      match,
      value: this.value?.value
    });
  }

  onValueChange(next: string): void {
    this.valueChange.emit({
      search_type: 'W',
      match: this.value?.match,
      value: next || undefined
    });
  }
}
