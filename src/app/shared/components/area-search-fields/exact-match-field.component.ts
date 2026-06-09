import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import {
  coerceScalarFieldValue,
  coerceTextInputValue,
  formatExactMatchDateValue,
  resolveExactMatchInputType,
  resolveTextMaxLength
} from '@app/core/utils/area-search-field-meta.util';
import { AreaSearchControlStyles } from './area-search-control.styles';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';

@Component({
  selector: 'app-area-search-exact-match-field',
  standalone: true,
  imports: [FormsModule, InputText, AreaSearchFieldLabelComponent],
  template: `
    <div class="flex flex-col gap-1.5">
      <app-area-search-field-label [label]="field.label" [htmlFor]="field.field_name" />
      <input
        pInputText
        [id]="field.field_name"
        [type]="inputType"
        [ngModel]="displayValue"
        (ngModelChange)="onValueChange($event)"
        [attr.min]="validationMin"
        [attr.max]="validationMax"
        [attr.maxlength]="maxLength"
        [class]="controlStyles.input"
      />
      @if (field.note) {
        <p class="text-xs text-surface-500">{{ field.note }}</p>
      }
    </div>
  `
})
export class AreaSearchExactMatchFieldComponent {
  protected readonly controlStyles = AreaSearchControlStyles;
  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  get inputType(): string {
    return resolveExactMatchInputType(this.field);
  }

  get maxLength(): number | null {
    return this.inputType === 'text' ? resolveTextMaxLength(this.field.validation) : null;
  }

  get validationMin(): number | string | null {
    if (this.inputType === 'text') {
      return null;
    }

    const min = this.field.validation?.['min'];
    return min == null || min === '' ? null : (min as number | string);
  }

  get validationMax(): number | string | null {
    if (this.inputType === 'text') {
      return null;
    }

    const max = this.field.validation?.['max'];
    return max == null || max === '' ? null : (max as number | string);
  }

  get displayValue(): string {
    const raw = coerceScalarFieldValue(this.value?.value);
    if (raw == null) {
      return '';
    }

    return this.inputType === 'date' ? formatExactMatchDateValue(raw) : String(raw);
  }

  onValueChange(next: string): void {
    this.valueChange.emit({
      search_type: 'EM',
      value: next || undefined
    });
  }
}
