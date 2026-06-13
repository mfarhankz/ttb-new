import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import {
  AREA_SEARCH_DATE_MATCH_OPTIONS,
  AREA_SEARCH_RANGE_MATCH_OPTIONS
} from '@app/authenticated/farming/config/area-search-fields.config';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import {
  formatExactMatchDateValue,
  resolveRangeInputType
} from '@app/core/utils/area-search-field-meta.util';
import { AreaSearchControlStyles } from './area-search-control.styles';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';

@Component({
  selector: 'app-area-search-range-field',
  standalone: true,
  imports: [FormsModule, InputText, Select, AreaSearchFieldLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-0.5">
      <app-area-search-field-label [label]="field.label" />

      <div class="grid grid-cols-2 items-center gap-2">
        <p-select
          size="small"
          [inputId]="field.field_name + '_match'"
          [options]="matchOptions"
          optionLabel="label"
          optionValue="value"
          [ngModel]="value?.match"
          (ngModelChange)="onMatchChange($event)"
          [panelStyleClass]="controlStyles.selectPanel"
          [class]="controlStyles.select"
        />

        @if (isBetween()) {
          <input
            pInputText
            [id]="field.field_name + '_from'"
            [type]="valueInputType"
            [ngModel]="displayFrom()"
            (ngModelChange)="onFromChange($event)"
            [attr.min]="valueInputMin"
            [attr.max]="valueInputMax"
            [attr.placeholder]="rangeValuePlaceholder('from')"
            [class]="controlStyles.input"
          />
        } @else {
          <input
            pInputText
            [id]="field.field_name"
            [type]="valueInputType"
            [ngModel]="displayValue()"
            (ngModelChange)="onValueChange($event)"
            [attr.min]="valueInputMin"
            [attr.max]="valueInputMax"
            [attr.placeholder]="rangeValuePlaceholder('value')"
            [class]="controlStyles.input"
          />
        }
      </div>

      @if (isBetween()) {
        <div class="grid grid-cols-2 items-center gap-2">
          <div class="min-w-0" aria-hidden="true"></div>
          <input
            pInputText
            [id]="field.field_name + '_to'"
            [type]="valueInputType"
            [ngModel]="displayTo()"
            (ngModelChange)="onToChange($event)"
            [attr.min]="valueInputMin"
            [attr.max]="valueInputMax"
            [attr.placeholder]="rangeValuePlaceholder('to')"
            [class]="controlStyles.input"
          />
        </div>
      }

      @if (field.note) {
        <p class="text-xs text-surface-500">{{ field.note }}</p>
      }
    </div>
  `
})
export class AreaSearchRangeFieldComponent implements OnInit {
  protected readonly controlStyles = AreaSearchControlStyles;
  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  matchOptions: { value: string; label: string }[] = [...AREA_SEARCH_RANGE_MATCH_OPTIONS];

  ngOnInit(): void {
    this.matchOptions = this.isDateRangeField
      ? [...AREA_SEARCH_DATE_MATCH_OPTIONS]
      : [...AREA_SEARCH_RANGE_MATCH_OPTIONS];
  }

  get isDateRangeField(): boolean {
    return (this.field.value_type ?? '').toLowerCase() === 'date';
  }

  get inputType(): 'number' | 'date' | 'text' {
    return resolveRangeInputType(this.field);
  }

  get isLastXMonths(): boolean {
    return this.value?.match === 'Last_x_Months';
  }

  /** Last X Months uses a plain number field — no date picker. */
  get valueInputType(): 'number' | 'date' | 'text' {
    if (this.isLastXMonths) {
      return 'number';
    }

    return this.inputType;
  }

  get validationMin(): number | string | null {
    const min = this.field.validation?.['min'];
    return min == null || min === '' ? null : (min as number | string);
  }

  get validationMax(): number | string | null {
    const max = this.field.validation?.['max'];
    return max == null || max === '' ? null : (max as number | string);
  }

  get valueInputMin(): number | string | null {
    return this.isLastXMonths ? (this.validationMin ?? 1) : this.validationMin;
  }

  get valueInputMax(): number | string | null {
    return this.validationMax;
  }

  isBetween(): boolean {
    return this.value?.match === 'Between' || this.value?.match === 'From-To';
  }

  rangeValuePlaceholder(slot: 'value' | 'from' | 'to'): string | null {
    if (this.isLastXMonths) {
      return null;
    }

    if (this.inputType === 'date') {
      return 'dd/mm/yyyy';
    }

    if (this.isBetween()) {
      return slot === 'from' ? 'From' : 'To';
    }

    return null;
  }

  displayValue(): string {
    const raw = this.value?.value;
    if (raw == null || raw === '') {
      return '';
    }

    return this.usesDateFormatting() ? formatExactMatchDateValue(raw) : String(raw);
  }

  displayFrom(): string {
    const raw = this.value?.from;
    if (raw == null || raw === '') {
      return '';
    }

    return this.usesDateFormatting() ? formatExactMatchDateValue(raw) : String(raw);
  }

  displayTo(): string {
    const raw = this.value?.to;
    if (raw == null || raw === '') {
      return '';
    }

    return this.usesDateFormatting() ? formatExactMatchDateValue(raw) : String(raw);
  }

  private usesDateFormatting(): boolean {
    return this.inputType === 'date' && !this.isLastXMonths;
  }

  onMatchChange(match: string): void {
    this.valueChange.emit({
      search_type: 'R',
      match,
      value: undefined,
      from: undefined,
      to: undefined
    });
  }

  onValueChange(next: string): void {
    this.valueChange.emit({
      search_type: 'R',
      match: this.value?.match,
      value: next || undefined,
      from: undefined,
      to: undefined
    });
  }

  onFromChange(next: string): void {
    this.valueChange.emit({
      search_type: 'R',
      match: this.value?.match ?? 'Between',
      from: next || undefined,
      to: this.value?.to,
      value: undefined
    });
  }

  onToChange(next: string): void {
    this.valueChange.emit({
      search_type: 'R',
      match: this.value?.match ?? 'Between',
      from: this.value?.from,
      to: next || undefined,
      value: undefined
    });
  }
}
