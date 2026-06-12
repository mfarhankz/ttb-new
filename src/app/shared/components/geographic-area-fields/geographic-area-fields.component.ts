import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { AREA_SEARCH_CHOICE_LOADING_PLACEHOLDER } from '@app/core/config/area-search-fields.config';
import { US_STATE_AREA_SEARCH_OPTIONS, resolveStateAbbrevFromFips } from '@app/core/config/us-states.config';
import { CountyChoice } from '@app/core/interfaces/property-search.interface';
import { AreaChoicesService } from '@app/core/services/area-choices.service';
import { AreaSearchControlStyles } from '@app/shared/components/area-search-fields/area-search-control.styles';
import {
  GeographicAreaCityZipControl,
  GeographicAreaCityZipMode,
  GeographicAreaFieldsValue,
  GeographicAreaGroupType,
  GeographicAreaLayout
} from './geographic-area-fields.types';

@Component({
  selector: 'app-geographic-area-fields',
  standalone: true,
  imports: [FormsModule, InputText, Select, MultiSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './geographic-area-fields.component.html',
  host: { class: 'block mb-4' }
})
export class GeographicAreaFieldsComponent {
  private static readonly EMPTY_GROUP_VALUES: string[] = [];

  protected readonly controlStyles = AreaSearchControlStyles;
  protected readonly choiceLoadingPlaceholder = AREA_SEARCH_CHOICE_LOADING_PLACEHOLDER;
  protected readonly stateOptions = US_STATE_AREA_SEARCH_OPTIONS;

  private readonly areaChoices = inject(AreaChoicesService);

  readonly layout = input<GeographicAreaLayout>('column');
  readonly cityZipMode = input<GeographicAreaCityZipMode>('separate');
  /** In `separate` mode: single select vs multiselect for city and zip. Grouped mode always multiselect. */
  readonly cityZipControl = input<GeographicAreaCityZipControl>('select');
  readonly disabled = input(false);
  readonly idPrefix = input('geo-area');
  readonly cityZipOptional = input(true);
  readonly disabledTooltip = input('');
  /** PrimeNG overlay target — use `"body"` inside modals. */
  readonly selectAppendTo = input<string | undefined>(undefined);

  readonly value = input<GeographicAreaFieldsValue>({});
  readonly valueChange = output<GeographicAreaFieldsValue>();
  readonly countiesChange = output<CountyChoice[]>();

  readonly countyOptions = signal<CountyChoice[]>([]);
  readonly cityOptions = signal<CountyChoice[]>([]);
  readonly zipOptions = signal<CountyChoice[]>([]);
  readonly countiesLoading = signal(false);
  readonly citiesLoading = signal(false);
  readonly zipsLoading = signal(false);

  readonly groupChoices = computed(() =>
    (this.value().groupType ?? 'sa_site_city') === 'sa_site_city'
      ? this.cityOptions()
      : this.zipOptions()
  );

  readonly groupLoading = computed(() =>
    (this.value().groupType ?? 'sa_site_city') === 'sa_site_city'
      ? this.citiesLoading()
      : this.zipsLoading()
  );

  readonly containerClass = computed(() => {
    if (this.layout() === 'row') {
      return this.cityZipMode() === 'separate'
        ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';
    }

    if (this.layout() === 'row-2') {
      return 'grid grid-cols-1 gap-3 sm:grid-cols-2';
    }

    return 'flex flex-col gap-4';
  });

  readonly cityLabel = computed(() =>
    this.cityZipOptional() ? 'City (Optional)' : 'City'
  );

  readonly zipLabel = computed(() =>
    this.cityZipOptional() ? 'Zip Code (Optional)' : 'Zip Code'
  );

  readonly useSeparateMultiselect = computed(
    () => this.cityZipMode() === 'separate' && this.cityZipControl() === 'multiselect'
  );

  readonly useSeparateSelect = computed(
    () => this.cityZipMode() === 'separate' && this.cityZipControl() === 'select'
  );

  readonly useSeparateText = computed(
    () => this.cityZipMode() === 'separate' && this.cityZipControl() === 'text'
  );

  private lastCountyFetchKey = '';
  private lastCityZipFetchKey = '';

  constructor() {
    effect(() => {
      const stateFips = this.value().stateFips;
      if (!stateFips) {
        this.countyOptions.set([]);
        this.countiesLoading.set(false);
        this.lastCountyFetchKey = '';
        this.countiesChange.emit([]);
        return;
      }

      if (this.lastCountyFetchKey === stateFips) {
        return;
      }

      this.lastCountyFetchKey = stateFips;
      this.countiesLoading.set(true);
      untracked(() => {
        this.areaChoices.fetchCountiesByFips(stateFips).subscribe({
          next: (options) => {
            this.countyOptions.set(options);
            this.countiesLoading.set(false);
            this.countiesChange.emit(options);
          },
          error: () => {
            this.countyOptions.set([]);
            this.countiesLoading.set(false);
            this.countiesChange.emit([]);
          }
        });
      });
    });

    effect(() => {
      const stateFips = this.value().stateFips;
      const countyFips = this.value().countyFips;
      if (!stateFips || !countyFips) {
        this.cityOptions.set([]);
        this.zipOptions.set([]);
        this.citiesLoading.set(false);
        this.zipsLoading.set(false);
        this.lastCityZipFetchKey = '';
        return;
      }

      const fetchKey = `${stateFips}|${countyFips}`;
      if (this.lastCityZipFetchKey === fetchKey) {
        return;
      }

      this.lastCityZipFetchKey = fetchKey;
      this.citiesLoading.set(true);
      this.zipsLoading.set(true);

      untracked(() => {
        this.areaChoices.fetchCitiesByFips(stateFips, countyFips).subscribe({
          next: (options) => {
            this.cityOptions.set(options);
            this.citiesLoading.set(false);
          },
          error: () => {
            this.cityOptions.set([]);
            this.citiesLoading.set(false);
          }
        });

        this.areaChoices.fetchZipCodesByFips(stateFips, countyFips).subscribe({
          next: (options) => {
            this.zipOptions.set(options);
            this.zipsLoading.set(false);
          },
          error: () => {
            this.zipOptions.set([]);
            this.zipsLoading.set(false);
          }
        });
      });
    });
  }

  fieldId(suffix: string): string {
    return `${this.idPrefix()}-${suffix}`;
  }

  onStateChange(stateFips: string | null): void {
    this.lastCountyFetchKey = '';
    this.lastCityZipFetchKey = '';
    this.countiesLoading.set(!!stateFips);
    this.citiesLoading.set(false);
    this.zipsLoading.set(false);

    this.emit({
      stateFips: stateFips ?? undefined,
      stateAbbrev: stateFips ? resolveStateAbbrevFromFips(stateFips) : undefined,
      countyFips: undefined,
      countyLabel: undefined,
      siteCity: undefined,
      siteZip: undefined,
      siteCities: GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES,
      siteZips: GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES,
      groupValues: GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES
    });
  }

  onCountyChange(countyFips: string | null): void {
    this.lastCityZipFetchKey = '';
    this.citiesLoading.set(!!countyFips);
    this.zipsLoading.set(!!countyFips);

    const countyLabel = this.countyOptions().find((choice) => choice.key === countyFips)?.value;

    this.emit({
      countyFips: countyFips ?? undefined,
      countyLabel,
      siteCity: undefined,
      siteZip: undefined,
      siteCities: GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES,
      siteZips: GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES,
      groupValues: GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES
    });
  }

  onSiteCityChange(siteCity: string | null): void {
    this.emit({ siteCity: siteCity ?? undefined });
  }

  onSiteZipChange(siteZip: string | null): void {
    this.emit({ siteZip: siteZip ?? undefined });
  }

  onSiteCitiesChange(values: string[] | null | undefined): void {
    const normalized = values?.length ? [...values] : GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES;
    this.emit({ siteCities: normalized });
  }

  onSiteZipsChange(values: string[] | null | undefined): void {
    const normalized = values?.length ? [...values] : GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES;
    this.emit({ siteZips: normalized });
  }

  onGroupTypeChange(groupType: GeographicAreaGroupType): void {
    if ((this.value().groupType ?? 'sa_site_city') === groupType) {
      return;
    }

    this.emit({ groupType });
  }

  onGroupValuesChange(values: string[] | null | undefined): void {
    const normalized = values?.length ? [...values] : GeographicAreaFieldsComponent.EMPTY_GROUP_VALUES;
    this.emit({ groupValues: normalized });
  }

  /** Clears cached fetch keys so the next value update re-fetches options (e.g. form reset). */
  resetFetchCache(): void {
    this.lastCountyFetchKey = '';
    this.lastCityZipFetchKey = '';
  }

  private emit(patch: Partial<GeographicAreaFieldsValue>): void {
    this.valueChange.emit({ ...this.value(), ...patch });
  }
}
