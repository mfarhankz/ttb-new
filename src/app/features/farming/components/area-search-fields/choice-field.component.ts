import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  effect,
  inject,
  signal
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { AreaSearchChoiceOption, AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchDynamicChoicesService } from '@app/features/farming/services/area-search-dynamic-choices.service';
import { AreaSearchFormService } from '@app/features/farming/services/area-search-form.service';
import {
  AREA_SEARCH_CHOICE_LOADING_PLACEHOLDER,
  AREA_SEARCH_CHOICE_PLACEHOLDERS
} from '@app/features/farming/config/area-search-fields.config';
import { US_STATE_AREA_SEARCH_OPTIONS } from '@app/core/config/us-states.config';
import { fieldHasBlankChoice } from '@app/core/utils/area-search-field-meta.util';
import { AreaSearchControlStyles } from './area-search-control.styles';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';
import {
  areaSearchFieldLabelId,
  mapFieldChoices
} from './area-search-field.utils';

@Component({
  selector: 'app-area-search-choice-field',
  standalone: true,
  imports: [FormsModule, Select, AreaSearchFieldLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-0.5">
      <app-area-search-field-label [label]="field.label" [labelId]="fieldLabelId" />
      <div
        class="relative"
        [class.pointer-events-none]="controlDisabled()"
        [class.opacity-60]="controlDisabled()"
      >
        <p-select
          size="small"
          [ariaLabelledBy]="fieldLabelId"
          [inputId]="field.field_name"
          [options]="options()"
          optionLabel="label"
          optionValue="value"
          [ngModel]="selectedValue"
          (ngModelChange)="onValueChange($event)"
          (onShow)="onPanelShow()"
          [disabled]="controlDisabled()"
          [loading]="loadingOptions()"
          [showClear]="false"
          [filter]="false"
          [placeholder]="displayPlaceholder"
          [panelStyleClass]="controlStyles.selectPanel"
          [class]="controlStyles.select"
        />
      </div>
      @if (field.note) {
        <p class="text-xs text-surface-500">{{ field.note }}</p>
      }
    </div>
  `
})
export class AreaSearchChoiceFieldComponent implements OnChanges, OnDestroy {
  protected readonly controlStyles = AreaSearchControlStyles;

  get fieldLabelId(): string {
    return areaSearchFieldLabelId(this.field.field_name);
  }

  private readonly formService = inject(AreaSearchFormService);
  private readonly dynamicChoices = inject(AreaSearchDynamicChoicesService);
  readonly controlDisabled = signal(false);

  constructor() {
    effect(() => {
      this.formService.formData();
      this.updateControlDisabled();
    });
  }

  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Input() dependencyKey = 'static';
  @Input() choicesDisabled = false;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  private readonly dynamicOptions = signal<AreaSearchChoiceOption[]>([]);
  private readonly staticOptions = signal<AreaSearchChoiceOption[]>([]);
  readonly options = signal<AreaSearchChoiceOption[]>([]);
  readonly loadingOptions = signal(false);
  private readonly lazyPanelOpened = signal(false);
  private fetchSubscription?: Subscription;

  get placeholder(): string {
    return AREA_SEARCH_CHOICE_PLACEHOLDERS[this.field.field_name] ?? 'Select';
  }

  get displayPlaceholder(): string {
    return this.loadingOptions() ? AREA_SEARCH_CHOICE_LOADING_PLACEHOLDER : this.placeholder;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      if (!this.usesDynamicChoices()) {
        this.staticOptions.set(mapFieldChoices(this.field));
      }

      if (this.field.field_name === 'mm_fips_state_code') {
        this.dynamicOptions.set(US_STATE_AREA_SEARCH_OPTIONS);
      }

      this.lazyPanelOpened.set(false);
      this.syncOptions();
      this.updateControlDisabled();
    }

    if (changes['choicesDisabled'] || changes['dependencyKey']) {
      this.updateControlDisabled();
    }

    if (changes['field'] || changes['dependencyKey']) {
      if (this.dynamicChoices.shouldLazyLoadField(this.field.field_name)) {
        this.lazyPanelOpened.set(false);
        this.dynamicOptions.set([]);
        this.syncOptions();
        return;
      }

      this.refreshDynamicOptions();
    }
  }

  ngOnDestroy(): void {
    this.fetchSubscription?.unsubscribe();
  }

  get selectedValue(): string | undefined {
    const raw = this.value?.value;
    return raw == null || raw === '' ? undefined : String(raw);
  }

  onPanelShow(): void {
    if (this.controlDisabled()) {
      return;
    }

    if (!this.dynamicChoices.shouldLazyLoadField(this.field.field_name)) {
      return;
    }

    if (this.lazyPanelOpened()) {
      return;
    }

    this.lazyPanelOpened.set(true);
    this.refreshDynamicOptions();
  }

  onValueChange(next: string | undefined): void {
    const normalized = next ?? undefined;
    if (normalized === this.selectedValue) {
      return;
    }

    this.valueChange.emit({
      search_type: 'C',
      value: normalized
    });
  }

  private usesDynamicChoices(): boolean {
    return !!this.field.choices_source || this.field.field_name === 'mm_fips_state_code';
  }

  private updateControlDisabled(): void {
    const disabled =
      this.choicesDisabled ||
      this.dynamicChoices.isGeographicFieldDisabled(this.field.field_name, this.formService.formData());

    this.controlDisabled.set(disabled);

    if (disabled) {
      this.fetchSubscription?.unsubscribe();
      this.loadingOptions.set(false);
      this.dynamicOptions.set([]);
      this.lazyPanelOpened.set(false);
      this.syncOptions();
    }
  }

  private refreshDynamicOptions(): void {
    const field = this.field;
    if (!field?.field_name || !this.usesDynamicChoices() || field.field_name === 'mm_fips_state_code') {
      return;
    }

    const formData = this.formService.formData();
    if (
      this.dynamicChoices.isGeographicFieldDisabled(field.field_name, formData) ||
      !this.dynamicChoices.hasRequiredInputs(field, formData)
    ) {
      this.dynamicOptions.set([]);
      this.syncOptions();
      return;
    }

    this.fetchSubscription?.unsubscribe();
    this.loadingOptions.set(true);

    this.fetchSubscription = this.dynamicChoices.fetchChoices({ field, formData }).subscribe({
      next: (options) => {
        this.dynamicOptions.set(options);
        this.loadingOptions.set(false);
        this.syncOptions();
      },
      error: () => {
        this.dynamicOptions.set([]);
        this.loadingOptions.set(false);
        this.syncOptions();
      }
    });
  }

  private syncOptions(): void {
    const usesDynamicChoices = this.usesDynamicChoices();
    const base = usesDynamicChoices ? this.dynamicOptions() : this.staticOptions();

    if (!fieldHasBlankChoice(this.field)) {
      this.options.set(base);
    } else {
      this.options.set([
        { value: '_blank_', label: 'Filter Off' },
        ...base.filter((option) => option.value !== '_blank_')
      ]);
    }

  }
}
