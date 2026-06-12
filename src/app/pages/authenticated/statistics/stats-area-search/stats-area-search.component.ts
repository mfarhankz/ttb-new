import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';
import {
  STATS_PROPERTY_TYPE_OPTIONS,
  STATS_RANGE_FIELDS,
  STATS_TRACT_TYPE_OPTIONS
} from '@app/core/config/statistics.config';
import { US_STATE_FIPS_BY_ABBREV } from '@app/core/config/us-states.config';
import { StatsRangeFieldValue, TractStatsFormData } from '@app/core/interfaces/statistics.interface';
import { AuthService } from '@app/core/services/auth.service';
import { StatsAreaSearchService } from '@app/core/services/stats-area-search.service';
import { StatsAreaSearchStateService } from '@app/core/services/stats-area-search-state.service';
import { StatisticsSessionService } from '@app/core/services/statistics-session.service';
import { MapDrawnGeometry } from '@app/core/services/ol-map.service';
import { fetchStateCountyFromGeometry } from '@app/core/utils/geometry-state-county.util';
import {
  buildTractStatsPayload,
  createDefaultStatsFormData,
  restoreStatsFormFromPayload
} from '@app/core/utils/stats-area-search-form.util';
import { AlertComponent, ButtonComponent, CardComponent, GeographicAreaFieldsComponent } from '@app/shared/components';
import { AreaSearchControlStyles } from '@app/shared/components/area-search-fields/area-search-control.styles';
import { GeographicAreaFieldsValue } from '@app/shared/components/geographic-area-fields/geographic-area-fields.types';
import { ClearSearchStateService } from '@app/core/services/clear-search-state.service';

@Component({
  selector: 'app-stats-area-search',
  standalone: true,
  imports: [
    FormsModule,
    CardComponent,
    AlertComponent,
    ButtonComponent,
    Select,
    MultiSelect,
    InputText,
    GeographicAreaFieldsComponent
  ],
  templateUrl: './stats-area-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsAreaSearchComponent implements OnInit, OnDestroy {
  protected readonly controlStyles = AreaSearchControlStyles;
  private static readonly EMPTY_SELECTION: string[] = [];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly stateService = inject(StatsAreaSearchStateService);
  private readonly statsAreaSearchService = inject(StatsAreaSearchService);
  private readonly statisticsSessionService = inject(StatisticsSessionService);
  private readonly authService = inject(AuthService);
  private readonly geographicFields = viewChild(GeographicAreaFieldsComponent);
  private readonly clearSearchState = inject(ClearSearchStateService);

  readonly rangeFields = STATS_RANGE_FIELDS;
  readonly propertyTypeOptions = STATS_PROPERTY_TYPE_OPTIONS.map((option) => ({
    key: option.key,
    value: option.value
  }));
  readonly geometryDisabledTooltip = 'This field is unavailable when doing a Radius/Boundary.';

  readonly geometry = signal<MapDrawnGeometry | undefined>(undefined);
  readonly returnUrl = signal('/statistics/radius-search');
  readonly formData = signal<TractStatsFormData>(createDefaultStatsFormData());
  readonly groupType = signal<'sa_site_city' | 'sa_site_zip'>('sa_site_city');
  readonly selectedPropertyTypes = signal<string[]>([...createDefaultStatsFormData().use_code_std!]);
  readonly selectedGroupValues = signal<string[]>(StatsAreaSearchComponent.EMPTY_SELECTION);
  readonly initializing = signal(true);
  readonly submitting = signal(false);
  readonly statusMessage = signal<string | null>(null);
  readonly statusType = signal<'success' | 'error'>('success');

  readonly isGeometryAvailable = computed(() => {
    const geometry = this.geometry();
    return !!(geometry?.match && geometry.value);
  });

  readonly pageTitle = computed(() =>
    this.isGeometryAvailable() ? 'Statistic — Available Filters' : 'Statistic — Area Search'
  );

  readonly geographicValue = computed(
    (): GeographicAreaFieldsValue => ({
      stateFips: this.formData().mm_fips_state_code,
      countyFips: this.formData().mm_fips_muni_code,
      groupType: this.groupType(),
      groupValues: [...this.selectedGroupValues()]
    })
  );

  readonly tractTypeOptions = computed(() => {
    const zipType = STATS_TRACT_TYPE_OPTIONS[1];
    const others = STATS_TRACT_TYPE_OPTIONS.slice(2);
    const selected = this.selectedGroupValues();

    if (!selected.length) {
      return STATS_TRACT_TYPE_OPTIONS;
    }

    if (this.groupType() === 'sa_site_city') {
      return [zipType, ...others];
    }

    return others;
  });

  private directSubmitScheduled = false;

  constructor() {
    effect(() => {
      if (this.initializing()) {
        this.clearSearchState.setStatsAreaSearchActive(false);
        return;
      }

      const form = this.formData();
      const hasRangeCriteria = STATS_RANGE_FIELDS.some((field) => {
        const range = form[field.name];
        return range?.from != null || range?.to != null;
      });
      const active =
        this.isGeometryAvailable() ||
        !!form.mm_fips_muni_code ||
        !!(form.sa_site_city_value?.length || form.sa_site_zip_value?.length) ||
        hasRangeCriteria;

      this.clearSearchState.setStatsAreaSearchActive(active);
    });
  }

  ngOnInit(): void {
    const queryReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const stateReturnUrl = this.stateService.consumeReturnUrl();
    this.returnUrl.set(queryReturnUrl ?? stateReturnUrl ?? '/statistics/radius-search');

    const geometry = this.stateService.consumePendingGeometry();
    if (geometry) {
      this.geometry.set(geometry);
    }

    void this.initializeForm();
  }

  ngOnDestroy(): void {
    this.clearSearchState.setStatsAreaSearchActive(false);
  }

  rangeValue(fieldName: (typeof STATS_RANGE_FIELDS)[number]['name']): StatsRangeFieldValue {
    return this.formData()[fieldName] ?? { match: 'Between' };
  }

  updateFormField<K extends keyof TractStatsFormData>(field: K, value: TractStatsFormData[K]): void {
    this.formData.update((current) => ({ ...current, [field]: value }));
  }

  updateRangeField(
    fieldName: (typeof STATS_RANGE_FIELDS)[number]['name'],
    part: 'from' | 'to',
    value: string | number | null
  ): void {
    this.formData.update((current) => ({
      ...current,
      [fieldName]: {
        ...(current[fieldName] ?? { match: 'Between' }),
        [part]: value === '' || value == null ? undefined : value
      }
    }));
  }

  onGeographicValueChange(value: GeographicAreaFieldsValue): void {
    const groupType = value.groupType ?? 'sa_site_city';
    const groupValues = value.groupValues ?? StatsAreaSearchComponent.EMPTY_SELECTION;
    const groupTypeChanged = groupType !== this.groupType();

    this.groupType.set(groupType);

    if (groupTypeChanged) {
      this.formData.update((current) => ({
        ...current,
        mm_fips_state_code: value.stateFips,
        mm_fips_muni_code: value.countyFips
      }));
      this.syncSelectedGroupValuesFromForm();
      this.syncTractTypeForGroupSelection();
      return;
    }

    this.selectedGroupValues.set(
      groupValues.length ? [...groupValues] : StatsAreaSearchComponent.EMPTY_SELECTION
    );

    this.formData.update((current) => ({
      ...current,
      mm_fips_state_code: value.stateFips,
      mm_fips_muni_code: value.countyFips,
      sa_site_city_value:
        groupType === 'sa_site_city' && groupValues.length ? [...groupValues] : undefined,
      sa_site_zip_value:
        groupType === 'sa_site_zip' && groupValues.length ? [...groupValues] : undefined
    }));
    this.syncTractTypeForGroupSelection();
  }

  onPropertyTypesChange(values: string[] | null | undefined): void {
    const normalized = values ?? [];
    if (this.arraysEqual(normalized, this.selectedPropertyTypes())) {
      return;
    }

    this.selectedPropertyTypes.set(
      normalized.length ? [...normalized] : StatsAreaSearchComponent.EMPTY_SELECTION
    );
    this.updateFormField('use_code_std', normalized.length ? [...normalized] : undefined);
  }

  resetForm(): void {
    this.statusMessage.set(null);
    const defaults = createDefaultStatsFormData();
    defaults.mm_fips_state_code = this.resolveDefaultStateFips();
    this.formData.set(defaults);
    this.groupType.set('sa_site_city');
    this.selectedPropertyTypes.set(defaults.use_code_std ? [...defaults.use_code_std] : []);
    this.selectedGroupValues.set(StatsAreaSearchComponent.EMPTY_SELECTION);
    this.geographicFields()?.resetFetchCache();
  }

  onCancel(): void {
    void this.router.navigateByUrl(this.returnUrl());
  }

  submitForm(): void {
    if (this.submitting()) {
      return;
    }

    this.statusMessage.set(null);
    this.submitting.set(true);

    const payload = buildTractStatsPayload(this.formData(), this.groupType(), this.geometry());
    const returnUrl = this.returnUrl();

    this.statsAreaSearchService
      .searchTractStats(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (result) => {
          const sessionId = this.statisticsSessionService.createSession({
            title: 'Statistics Results',
            payload,
            info: {
              ...result.info,
              tract_type: result.info.tract_type ?? payload.tract_type,
              geometry: this.geometry(),
              groupType: this.groupType()
            },
            rows: result.records,
            geometry: this.geometry(),
            returnUrl
          });

          void this.router.navigate(['/detail/statistics', sessionId], {
            queryParams: { returnUrl }
          });
        },
        error: (err: Error) => {
          this.statusType.set('error');
          this.statusMessage.set(err.message ?? 'Statistics search failed.');
        }
      });
  }

  private async initializeForm(): Promise<void> {
    this.initializing.set(true);
    this.statusMessage.set(null);
    this.directSubmitScheduled = false;

    const editPayload = this.stateService.consumeEditPayload();
    const editGroupType = this.stateService.consumeEditGroupType();
    const runDirectSubmit = this.stateService.consumeRunDirectSubmitOnEntry();

    if (editPayload) {
      await this.initializeFromEditPayload(editPayload, editGroupType ?? undefined);
      return;
    }

    const defaults = createDefaultStatsFormData();
    defaults.mm_fips_state_code = this.resolveDefaultStateFips();

    if (this.isGeometryAvailable()) {
      const location = await fetchStateCountyFromGeometry(this.geometry());
      if (location.mm_fips_state_code) {
        defaults.mm_fips_state_code = location.mm_fips_state_code;
      }
      defaults.mm_fips_muni_code = undefined;
    }

    this.formData.set(defaults);
    this.groupType.set('sa_site_city');
    this.selectedPropertyTypes.set(defaults.use_code_std ? [...defaults.use_code_std] : []);
    this.selectedGroupValues.set(StatsAreaSearchComponent.EMPTY_SELECTION);
    this.geographicFields()?.resetFetchCache();

    this.initializing.set(false);
    this.scheduleDirectSubmitIfNeeded(runDirectSubmit);
  }

  private async initializeFromEditPayload(
    payload: TractStatsFormData,
    editGroupType?: 'sa_site_city' | 'sa_site_zip'
  ): Promise<void> {
    const { formData, groupType } = restoreStatsFormFromPayload(payload, {
      groupType: editGroupType
    });

    if (this.isGeometryAvailable()) {
      const location = await fetchStateCountyFromGeometry(this.geometry());
      if (location.mm_fips_state_code) {
        formData.mm_fips_state_code = location.mm_fips_state_code;
      }
      formData.mm_fips_muni_code = undefined;
    }

    this.formData.set(formData);
    this.groupType.set(groupType);
    this.selectedPropertyTypes.set(formData.use_code_std ? [...formData.use_code_std] : []);
    this.syncSelectedGroupValuesFromForm();
    this.geographicFields()?.resetFetchCache();

    this.initializing.set(false);

    if (this.route.snapshot.queryParamMap.get('edit') === 'true') {
      return;
    }

    this.scheduleDirectSubmitIfNeeded(false);
  }

  private scheduleDirectSubmitIfNeeded(runDirectSubmit: boolean): void {
    if (runDirectSubmit && !this.directSubmitScheduled) {
      this.directSubmitScheduled = true;
      setTimeout(() => this.submitForm(), 800);
    }
  }

  private resolveDefaultStateFips(): string {
    const profileState = this.authService.tbUser()?.state;
    if (typeof profileState === 'string' && profileState.trim()) {
      return US_STATE_FIPS_BY_ABBREV[profileState.trim().toUpperCase()] ?? '06';
    }

    return '06';
  }

  private syncTractTypeForGroupSelection(): void {
    const allowed = new Set(this.tractTypeOptions().map((option) => option.value));
    const current = this.formData().tract_type;
    if (current && !allowed.has(current)) {
      this.updateFormField('tract_type', 'carrier_route');
    }
  }

  private syncSelectedGroupValuesFromForm(): void {
    const form = this.formData();
    const key = `${this.groupType()}_value` as keyof TractStatsFormData;
    const value = form[key];
    const next = Array.isArray(value) ? value.map(String) : [];

    if (this.arraysEqual(next, this.selectedGroupValues())) {
      return;
    }

    this.selectedGroupValues.set(
      next.length ? [...next] : StatsAreaSearchComponent.EMPTY_SELECTION
    );
  }

  private arraysEqual(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }
}
