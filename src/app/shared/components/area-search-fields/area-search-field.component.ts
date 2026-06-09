import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchChoiceFieldComponent } from './choice-field.component';
import { AreaSearchChoiceMultipleFieldComponent } from './choice-multiple-field.component';
import { AreaSearchChoiceTreeFieldComponent } from './choice-tree-field.component';
import { AreaSearchRangeFieldComponent } from './range-field.component';
import { AreaSearchWildcardFieldComponent } from './wildcard-field.component';
import { AreaSearchExactMatchFieldComponent } from './exact-match-field.component';
import { AreaSearchCheckboxesFieldComponent } from './checkboxes-field.component';
import { AreaSearchRadioFieldComponent } from './radio-field.component';
import { AreaSearchContactFieldComponent } from './contact-field.component';
import { AreaSearchGeometryFieldComponent } from './geometry-field.component';
@Component({
  selector: 'app-area-search-field',
  standalone: true,
  imports: [
    AreaSearchChoiceFieldComponent,
    AreaSearchChoiceMultipleFieldComponent,
    AreaSearchChoiceTreeFieldComponent,
    AreaSearchRangeFieldComponent,
    AreaSearchWildcardFieldComponent,
    AreaSearchExactMatchFieldComponent,
    AreaSearchCheckboxesFieldComponent,
    AreaSearchRadioFieldComponent,
    AreaSearchContactFieldComponent,
    AreaSearchGeometryFieldComponent
  ],
  template: `
    @switch (field.search_type) {
      @case ('C') {
        <app-area-search-choice-field
          [field]="field"
          [value]="value"
          [dependencyKey]="dependencyKey"
          [choicesDisabled]="choicesDisabled"
          (valueChange)="emitChange($event)"
        />
      }
      @case ('CM') {
        <app-area-search-choice-multiple-field
          [field]="field"
          [value]="value"
          [dependencyKey]="dependencyKey"
          [choicesDisabled]="choicesDisabled"
          (valueChange)="emitChange($event)"
        />
      }
      @case ('CT') {
        <app-area-search-choice-tree-field
          [field]="field"
          [value]="value"
          (valueChange)="emitChange($event)"
        />
      }
      @case ('R') {
        <app-area-search-range-field
          [field]="field"
          [value]="value"
          (valueChange)="emitChange($event)"
        />
      }
      @case ('W') {
        <app-area-search-wildcard-field
          [field]="field"
          [value]="value"
          (valueChange)="emitChange($event)"
        />
      }
      @case ('EM') {
        <app-area-search-exact-match-field
          [field]="field"
          [value]="value"
          (valueChange)="emitChange($event)"
        />
      }
      @case ('CHB') {
        <app-area-search-checkboxes-field
          [field]="field"
          [value]="value"
          (valueChange)="emitChange($event)"
        />
      }
      @case ('RDB') {
        @if (field.field_name === 'include_contact_info') {
          <app-area-search-contact-field
            [field]="field"
            [value]="value"
            (valueChange)="emitChange($event)"
          />
        } @else {
          <app-area-search-radio-field
            [field]="field"
            [value]="value"
            (valueChange)="emitChange($event)"
          />
        }
      }
      @case ('geometry') {
        <app-area-search-geometry-field
          [value]="value"
          (valueChange)="emitChange($event)"
        />
      }
      @default {
        <div class="text-sm text-subtle">Unsupported field type: {{ field.search_type }}</div>
      }
    }
  `
})
export class AreaSearchFieldComponent {
  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Input() dependencyKey = 'static';
  @Input() choicesDisabled = false;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  emitChange(patch: Partial<AreaSearchFormFieldValue>): void {
    this.valueChange.emit(patch);
  }
}
