import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { AreaSearchControlStyles } from './area-search-control.styles';
import { splitFieldLabel } from './area-search-field.utils';

@Component({
  selector: 'app-area-search-field-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tag === 'legend') {
      <legend class="m-0 p-0" [class]="labelClass">
        @if (secondary(); as suffix) {
          {{ primary() }}
          <span class="text-caption font-normal text-subtle">{{ suffix }}</span>
        } @else {
          {{ label }}
        }
      </legend>
    } @else {
      <label [attr.for]="htmlFor || null" [class]="labelClass">
        @if (secondary(); as suffix) {
          {{ primary() }}
          <span class="text-caption font-normal text-subtle">{{ suffix }}</span>
        } @else {
          {{ label }}
        }
      </label>
    }
  `
})
export class AreaSearchFieldLabelComponent {
  protected readonly labelClass = AreaSearchControlStyles.fieldLabel;

  @Input({ required: true }) label!: string;
  @Input() htmlFor?: string;
  @Input() tag: 'label' | 'legend' = 'label';

  private readonly parts = computed(() => splitFieldLabel(this.label));
  readonly primary = computed(() => this.parts().primary);
  readonly secondary = computed(() => this.parts().secondary);
}
