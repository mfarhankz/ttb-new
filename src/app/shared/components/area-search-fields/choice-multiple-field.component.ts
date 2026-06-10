import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchDynamicChoicesService } from '@app/core/services/area-search-dynamic-choices.service';
import { AreaSearchFormService } from '@app/core/services/area-search-form.service';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';
import { AutocompleteItem } from '../autocomplete/autocomplete.types';
import {
  AREA_SEARCH_CHOICE_LOADING_PLACEHOLDER,
  AREA_SEARCH_CHOICE_PLACEHOLDERS
} from '@app/core/config/area-search-fields.config';
import { AreaSearchControlStyles } from './area-search-control.styles';
import { AreaSearchFieldLabelComponent } from './area-search-field-label.component';
import { AreaSearchChoiceOption, mapFieldChoices } from './area-search-field.utils';

@Component({
  selector: 'app-area-search-choice-multiple-field',
  standalone: true,
  imports: [FormsModule, MultiSelect, AutocompleteComponent, AreaSearchFieldLabelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-0.5">
      <app-area-search-field-label [label]="field.label" [htmlFor]="field.field_name" />

      @if (isAutocomplete) {
        <app-autocomplete
          [inputId]="field.field_name"
          placeholder="Type to search..."
          [disabled]="controlDisabled()"
          [items]="autocompleteItems()"
          [loading]="autocompleteLoading()"
          [noMatch]="autocompleteNoMatch()"
          (queryChange)="onAutocompleteQuery($event)"
          (itemSelect)="onAutocompleteSelect($event)"
        />
        @if (selectedAutocompleteLabel) {
          <p class="text-xs text-surface-600">Selected: {{ selectedAutocompleteLabel }}</p>
        }
      } @else {
        <div
          class="relative"
          [class.pointer-events-none]="controlDisabled()"
          [class.opacity-60]="controlDisabled()"
        >
          <p-multiselect
            [inputId]="field.field_name"
            [options]="options()"
            optionLabel="label"
            optionValue="value"
            [ngModel]="selectedValues()"
            (ngModelChange)="onValueChange($event)"
            (onPanelShow)="onPanelShow()"
            [disabled]="controlDisabled()"
            [showToggleAll]="false"
            [showHeader]="false"
            [filter]="false"
            [highlightOnSelect]="true"
            display="chip"
            [maxSelectedLabels]="100"
            [placeholder]="displayPlaceholder"
            scrollHeight="250px"
            [panelStyleClass]="controlStyles.treeMultiSelectPanel"
            [chipIcon]="controlStyles.chipRemoveIcon"
            [class]="controlStyles.treeMultiSelect + (loadingOptions() ? ' opacity-80' : '')"
          />
          @if (loadingOptions()) {
            <i
              class="pi pi-spinner pi-spin pointer-events-none absolute right-9 top-3 text-sm text-subtle"
              aria-hidden="true"
            ></i>
          }
        </div>
      }

      @if (field.note) {
        <p class="text-xs text-surface-500">{{ field.note }}</p>
      }
    </div>
  `
})
export class AreaSearchChoiceMultipleFieldComponent implements OnChanges, OnDestroy {
  protected readonly controlStyles = AreaSearchControlStyles;
  private readonly destroyRef = inject(DestroyRef);
  private readonly formService = inject(AreaSearchFormService);
  private readonly dynamicChoices = inject(AreaSearchDynamicChoicesService);
  readonly controlDisabled = signal(false);
  private fetchSubscription?: Subscription;

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
  private readonly lazyPanelOpened = signal(false);
  private readonly emptySelection: string[] = [];
  readonly selectedValues = signal<string[]>(this.emptySelection);
  readonly loadingOptions = signal(false);

  readonly autocompleteLoading = signal(false);
  readonly autocompleteNoMatch = signal(false);

  readonly options = computed(() => {
    return this.usesDynamicChoices() ? this.dynamicOptions() : this.staticOptions();
  });

  readonly autocompleteItems = computed<AutocompleteItem<string>[]>(() =>
    this.dynamicOptions().map((option) => ({
      id: option.value,
      label: option.label,
      value: option.value
    }))
  );

  ngOnDestroy(): void {
    this.fetchSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.syncSelectedValues();
    }

    if (changes['field']) {
      if (!this.usesDynamicChoices()) {
        this.staticOptions.set(mapFieldChoices(this.field));
      }

      this.lazyPanelOpened.set(false);
      this.dynamicOptions.set([]);
      this.syncSelectedValues();
      this.updateControlDisabled();
    }

    if (changes['choicesDisabled'] || changes['dependencyKey']) {
      this.updateControlDisabled();
    }

    if (changes['field'] || changes['dependencyKey']) {
      if (this.dynamicChoices.shouldLazyLoadField(this.field.field_name)) {
        this.lazyPanelOpened.set(false);
      }

      this.refreshDynamicOptions();
    }
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
    }
  }

  get placeholder(): string {
    return AREA_SEARCH_CHOICE_PLACEHOLDERS[this.field.field_name] ?? 'Select';
  }

  get displayPlaceholder(): string {
    return this.loadingOptions() ? AREA_SEARCH_CHOICE_LOADING_PLACEHOLDER : this.placeholder;
  }

  get isAutocomplete(): boolean {
    return this.dynamicChoices.isAutocompleteField(this.field);
  }

  get selectedAutocompleteLabel(): string {
    const raw = this.value?.value;
    if (raw == null || raw === '') {
      return '';
    }

    const match = this.dynamicOptions().find((option) => option.value === String(raw));
    return match?.label ?? String(raw);
  }

  onPanelShow(): void {
    if (this.controlDisabled()) {
      return;
    }

    if (!this.dynamicChoices.shouldLazyLoadField(this.field.field_name)) {
      return;
    }

    if (this.lazyPanelOpened() && this.options().length) {
      return;
    }

    this.lazyPanelOpened.set(true);
    this.refreshDynamicOptions();
  }

  onValueChange(next: string[]): void {
    const normalized = next ?? [];
    if (this.arraysEqual(normalized, this.selectedValues())) {
      return;
    }

    this.selectedValues.set(normalized.length ? [...normalized] : this.emptySelection);
    this.valueChange.emit({
      search_type: 'CM',
      value: normalized.length ? normalized : undefined
    });
  }

  onAutocompleteQuery(query: string): void {
    const field = this.field;
    const formData = this.formService.formData();

    if (!query.trim() || !this.dynamicChoices.hasRequiredInputs(field, formData)) {
      this.dynamicOptions.set([]);
      this.autocompleteNoMatch.set(false);
      return;
    }

    this.autocompleteLoading.set(true);
    this.dynamicChoices
      .fetchChoices({ field, formData, autocompleteQuery: query })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          this.dynamicOptions.set(options);
          this.autocompleteLoading.set(false);
          this.autocompleteNoMatch.set(options.length === 0);
        },
        error: () => {
          this.autocompleteLoading.set(false);
          this.autocompleteNoMatch.set(true);
        }
      });
  }

  onAutocompleteSelect(item: AutocompleteItem<string>): void {
    this.valueChange.emit({
      search_type: 'CM',
      value: item.value
    });
    this.dynamicOptions.set([]);
  }

  private syncSelectedValues(): void {
    const raw = this.value?.value;
    const next = Array.isArray(raw) ? raw.map(String) : [];

    if (this.arraysEqual(next, this.selectedValues())) {
      return;
    }

    this.selectedValues.set(next.length ? [...next] : this.emptySelection);
  }

  private arraysEqual(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }

  private usesDynamicChoices(): boolean {
    return (
      !!this.field.choices_source ||
      ['sa_site_city', 'sa_site_zip', 'leads_type'].includes(this.field.field_name)
    );
  }

  private refreshDynamicOptions(): void {
    const field = this.field;
    if (!field?.field_name || this.dynamicChoices.isAutocompleteField(field) || !this.usesDynamicChoices()) {
      return;
    }

    const formData = this.formService.formData();
    if (
      this.dynamicChoices.isGeographicFieldDisabled(field.field_name, formData) ||
      !this.dynamicChoices.hasRequiredInputs(field, formData)
    ) {
      this.loadingOptions.set(false);
      this.dynamicOptions.set([]);
      return;
    }

    this.fetchSubscription?.unsubscribe();
    this.loadingOptions.set(true);

    this.fetchSubscription = this.dynamicChoices.fetchChoices({ field, formData }).subscribe({
      next: (options) => {
        this.dynamicOptions.set(options);
        this.loadingOptions.set(false);
      },
      error: () => {
        this.dynamicOptions.set([]);
        this.loadingOptions.set(false);
      }
    });
  }
}
