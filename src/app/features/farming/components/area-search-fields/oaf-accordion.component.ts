import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { AreaSearchFieldMeta } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchAccordionStateService } from '@app/features/farming/services/area-search-accordion-state.service';
import { AreaSearchControlStyles } from './area-search-control.styles';

@Component({
  selector: 'app-area-search-oaf-accordion',
  standalone: true,
  imports: [FormsModule, Checkbox, Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  host: {
    class: 'block'
  },
  template: `
    @if (availableFields.length) {
      <p-accordion
        [multiple]="false"
        [class]="controlStyles.oafAccordion"
        [value]="accordionState.panelValue('oaf')"
        (valueChange)="accordionState.onPanelChange('oaf', $event)"
      >
        <p-accordion-panel value="oaf">
          <p-accordion-header>Other Available Fields</p-accordion-header>
          <p-accordion-content>
            <div class="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
              @for (field of availableFields; track field.field_name) {
                <label class="inline-flex cursor-pointer items-center gap-2 text-body-sm text-foreground">
                  <p-checkbox
                    [binary]="true"
                    [ngModel]="isPromoted(field.field_name)"
                    (ngModelChange)="onToggle(field, $event)"
                  />
                  <span>{{ field.label }}</span>
                </label>
              }
            </div>
          </p-accordion-content>
        </p-accordion-panel>
      </p-accordion>
    }
  `
})
export class AreaSearchOafAccordionComponent {
  protected readonly controlStyles = AreaSearchControlStyles;
  protected readonly accordionState = inject(AreaSearchAccordionStateService);
  @Input() availableFields: AreaSearchFieldMeta[] = [];
  @Input() promotedFieldNames: ReadonlySet<string> = new Set();
  @Output() promote = new EventEmitter<AreaSearchFieldMeta>();
  @Output() demote = new EventEmitter<string>();

  isPromoted(fieldName: string): boolean {
    return this.promotedFieldNames.has(fieldName);
  }

  onToggle(field: AreaSearchFieldMeta, checked: boolean): void {
    if (checked) {
      this.promote.emit(field);
      return;
    }

    this.demote.emit(field.field_name);
  }
}
