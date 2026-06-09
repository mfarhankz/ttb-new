import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import {
  AREA_SEARCH_DATE_MATCH_OPTIONS,
  AREA_SEARCH_RANGE_MATCH_OPTIONS
} from '@app/core/config/area-search-fields.config';
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
    <div class="flex flex-col gap-1.5">
      <app-area-search-field-label [label]="field.label" />

      <div class="grid grid-cols-2 gap-2">
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
            [type]="inputType"
            [ngModel]="displayFrom()"
            (ngModelChange)="onFromChange($event)"
            [attr.min]="validationMin"
            [attr.max]="validationMax"
            [attr.placeholder]="inputType === 'date' ? 'dd/mm/yyyy' : 'From'"
            [class]="controlStyles.input"
          />
        } @else {
          <input
            pInputText
            [id]="field.field_name"
            [type]="inputType"
            [ngModel]="displayValue()"
            (ngModelChange)="onValueChange($event)"
            [attr.min]="validationMin"
            [attr.max]="validationMax"
            [attr.placeholder]="inputType === 'date' ? 'dd/mm/yyyy' : null"
            [class]="controlStyles.input"
          />
        }
      </div>

      @if (isBetween()) {
        <div class="grid grid-cols-2 gap-2">
          <div class="min-w-0" aria-hidden="true"></div>
          <input
            pInputText
            [id]="field.field_name + '_to'"
            [type]="inputType"
            [ngModel]="displayTo()"
            (ngModelChange)="onToChange($event)"
            [attr.min]="validationMin"
            [attr.max]="validationMax"
            [attr.placeholder]="inputType === 'date' ? 'dd/mm/yyyy' : 'To'"
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
    this.matchOptions =
      this.field.value_type === 'date'
        ? [...AREA_SEARCH_DATE_MATCH_OPTIONS]
        : [...AREA_SEARCH_RANGE_MATCH_OPTIONS];
  }

  get inputType(): 'number' | 'date' | 'text' {
    return resolveRangeInputType(this.field);
  }

  get validationMin(): number | string | null {
    const min = this.field.validation?.['min'];
    return min == null || min === '' ? null : (min as number | string);
  }

  get validationMax(): number | string | null {
    const max = this.field.validation?.['max'];
    return max == null || max === '' ? null : (max as number | string);
  }

  isBetween(): boolean {
    return this.value?.match === 'Between' || this.value?.match === 'From-To';
  }

  displayValue(): string {
    const raw = this.value?.value;
    if (raw == null || raw === '') {
      return '';
    }

    return this.inputType === 'date' ? formatExactMatchDateValue(raw) : String(raw);
  }

  displayFrom(): string {
    const raw = this.value?.from;
    if (raw == null || raw === '') {
      return '';
    }

    return this.inputType === 'date' ? formatExactMatchDateValue(raw) : String(raw);
  }

  displayTo(): string {
    const raw = this.value?.to;
    if (raw == null || raw === '') {
      return '';
    }

    return this.inputType === 'date' ? formatExactMatchDateValue(raw) : String(raw);
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
