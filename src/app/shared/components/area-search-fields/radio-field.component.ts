import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButton } from 'primeng/radiobutton';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';
import { mapFieldChoices } from './area-search-field.utils';

@Component({
  selector: 'app-area-search-radio-field',
  standalone: true,
  imports: [FormsModule, RadioButton, AreaSearchFieldLabelComponent],
  template: `
    <fieldset class="m-0 flex min-w-0 flex-col gap-0.5 border-0 p-0">
      <app-area-search-field-label tag="legend" [label]="field.label" />
      @for (option of options; track option.value) {
        <label class="inline-flex items-center gap-2 text-sm">
          <p-radiobutton
            [name]="field.field_name"
            [value]="option.value"
            [ngModel]="value?.value"
            (ngModelChange)="onChange($event)"
          />
          <span>{{ option.label }}</span>
        </label>
      }
    </fieldset>
  `
})
export class AreaSearchRadioFieldComponent {
  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  get options() {
    return mapFieldChoices(this.field);
  }

  onChange(next: string): void {
    this.valueChange.emit({ search_type: 'RDB', value: next });
  }
}
