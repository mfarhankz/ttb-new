import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AreaSearchFieldGroup,
  AreaSearchFieldMeta,
  AreaSearchFormData,
  AreaSearchFormFieldValue,
  AreaSearchPayload
} from '../interfaces/area-search-field.interface';
import {
  createEmptyFieldValue,
  flatCustomFilters,
  hasValidGeometry,
  parseFormData,
  payloadToFormData,
  removeFormDataField
} from '../utils/area-search-form.util';
import { AREA_SEARCH_CRITERIA_ALWAYS_VISIBLE_FIELDS } from '../config/area-search-fields.config';
import { AreaSearchFieldsService } from './area-search-fields.service';

@Injectable({ providedIn: 'root' })
export class AreaSearchFormService {
  private readonly fieldsService = inject(AreaSearchFieldsService);

  private readonly _formData = signal<AreaSearchFormData>({
    omit_saved_records: { value: false },
    max_limit: { check: false, value: undefined }
  });
  private readonly _activeTab = signal(0);
  private readonly _promotedOafFields = signal<Set<string>>(new Set());
  private initializedFieldNames = new Set<string>();

  readonly formData = this._formData.asReadonly();
  readonly activeTab = this._activeTab.asReadonly();
  readonly promotedOafFields = this._promotedOafFields.asReadonly();

  readonly hasGeometry = computed(() => hasValidGeometry(this._formData()));
  readonly fieldsInfo = computed(() => this.fieldsService.fieldsInfo());
  readonly fieldGroups = computed(() => this.fieldsService.fieldGroups());
  readonly basicFieldGroups = computed(() => this.fieldsService.getBasicFieldGroups());

  readonly activeFieldGroup = computed(() => {
    const groups = this.basicFieldGroups();
    const index = this._activeTab();
    return groups[index] ?? null;
  });

  initForm(): void {
    this.initializedFieldNames.clear();
    this._formData.set({
      omit_saved_records: { value: false },
      max_limit: { check: false, value: undefined }
    });
    this._activeTab.set(0);
    this._promotedOafFields.set(new Set());
    this.pruneInactiveOafFields();
    this.ensureDefaultFieldsInitialized();
    this.ensureFieldsInitialized(this.activeFieldGroup());
  }

  setActiveTab(index: number): void {
    this._activeTab.set(index);
    queueMicrotask(() => this.ensureFieldsInitialized(this.activeFieldGroup()));
  }

  private pruneInactiveOafFields(): void {
    const promoted = this._promotedOafFields();
    const oafNames = new Set(
      this.basicFieldGroups().flatMap((group) => group.other_fields?.map((field) => field.field_name) ?? [])
    );

    if (!oafNames.size) {
      return;
    }

    this._formData.update((current) => {
      const next = { ...current };
      let changed = false;

      for (const fieldName of oafNames) {
        if (promoted.has(fieldName) || !(fieldName in next)) {
          continue;
        }

        delete next[fieldName];
        this.initializedFieldNames.delete(fieldName);
        changed = true;
      }

      return changed ? next : current;
    });
  }

  /** Apply searchable defaults for fields on other tabs (e.g. Property Type). */
  private ensureDefaultFieldsInitialized(): void {
    const fieldsInfo = this.fieldsService.getFieldsInfoSync();
    if (!fieldsInfo) {
      return;
    }

    const updates: Record<string, AreaSearchFormFieldValue> = {};

    for (const fieldName of AREA_SEARCH_CRITERIA_ALWAYS_VISIBLE_FIELDS) {
      if (this.initializedFieldNames.has(fieldName)) {
        continue;
      }

      const fieldInfo = fieldsInfo[fieldName];
      if (!fieldInfo) {
        continue;
      }

      updates[fieldName] = createEmptyFieldValue(fieldInfo);
      this.initializedFieldNames.add(fieldName);
    }

    if (!Object.keys(updates).length) {
      return;
    }

    this._formData.update((current) => ({
      ...current,
      ...updates
    }));
  }

  ensureFieldsInitialized(group: AreaSearchFieldGroup | null): void {
    if (!group) {
      return;
    }

    const fieldsInfo = this.fieldsService.getFieldsInfoSync();
    if (!fieldsInfo) {
      return;
    }

    const updates: Record<string, AreaSearchFormFieldValue> = {};
    for (const field of group.fields) {
      if (this.initializedFieldNames.has(field.field_name)) {
        continue;
      }

      const fieldInfo = fieldsInfo[field.field_name];
      if (!fieldInfo) {
        continue;
      }

      updates[field.field_name] = createEmptyFieldValue(fieldInfo);
      this.initializedFieldNames.add(field.field_name);
    }

    if (!Object.keys(updates).length) {
      return;
    }

    this._formData.update((current) => ({
      ...current,
      ...updates
    }));
  }

  updateFieldValue(fieldName: string, patch: Partial<AreaSearchFormData[string]>): void {
    const dependentsToClear =
      fieldName === 'mm_fips_state_code'
        ? ['mm_fips_muni_code', 'sa_site_city', 'sa_site_zip']
        : fieldName === 'mm_fips_muni_code'
          ? ['sa_site_city', 'sa_site_zip']
          : [];

    this._formData.update((current) => {
      const next: AreaSearchFormData = {
        ...current,
        [fieldName]: {
          ...(current[fieldName] ?? {}),
          ...patch
        }
      };

      if (dependentsToClear.length) {
        this.clearDependentValues(next, dependentsToClear);
      }

      return next;
    });

    this.initializedFieldNames.add(fieldName);
  }

  private clearDependentValues(formData: AreaSearchFormData, fieldNames: string[]): void {
    for (const name of fieldNames) {
      const field = formData[name];
      if (!field) {
        continue;
      }

      formData[name] = {
        ...field,
        value: undefined
      };
    }
  }

  promoteOafField(field: AreaSearchFieldMeta): void {
    this._promotedOafFields.update((current) => {
      const next = new Set(current);
      next.add(field.field_name);
      return next;
    });

    const fieldsInfo = this.fieldsService.getFieldsInfoSync();
    const fieldInfo = fieldsInfo?.[field.field_name];
    if (fieldInfo && !this.initializedFieldNames.has(field.field_name)) {
      this._formData.update((current) => ({
        ...current,
        [field.field_name]: createEmptyFieldValue(fieldInfo)
      }));
      this.initializedFieldNames.add(field.field_name);
      return;
    }

    this.updateFieldValue(field.field_name, {
      search_type: field.search_type,
      value: undefined
    });
  }

  demoteOafField(fieldName: string): void {
    this._promotedOafFields.update((current) => {
      const next = new Set(current);
      next.delete(fieldName);
      return next;
    });
    this.clearField(fieldName);
  }

  isOafPromoted(fieldName: string): boolean {
    return this._promotedOafFields().has(fieldName);
  }

  clearAllFields(): void {
    const fieldsInfo = this.fieldsService.getFieldsInfoSync() ?? {};
    const next: AreaSearchFormData = {
      omit_saved_records: { value: false },
      max_limit: { check: false, value: undefined }
    };

    for (const fieldName of this.initializedFieldNames) {
      const fieldInfo = fieldsInfo[fieldName];
      if (!fieldInfo) {
        continue;
      }
      next[fieldName] = createEmptyFieldValue(fieldInfo);
    }

    if (this._formData().geometry) {
      delete next.geometry;
    }

    this._formData.set(next);
  }

  resetArrangements(): void {
    const promoted = [...this._promotedOafFields()];
    for (const fieldName of promoted) {
      this.clearField(fieldName);
    }
    this._promotedOafFields.set(new Set());
  }

  clearField(fieldName: string): void {
    const fieldsInfo = this.fieldsService.getFieldsInfoSync();
    const fieldInfo = fieldsInfo?.[fieldName];
    const next = removeFormDataField(fieldName, fieldInfo, { ...this._formData() });
    this._formData.set(next);
  }

  setGeometry(geometry: AreaSearchFormData['geometry']): void {
    this.updateFieldValue('geometry', {
      search_type: 'geometry',
      ...geometry
    });
  }

  clearGeometry(): void {
    this._formData.update((current) => {
      const next = { ...current };
      delete next.geometry;
      return next;
    });
  }

  buildPayload(): AreaSearchPayload {
    const fieldsInfo = this.fieldsService.getFieldsInfoSync() ?? {};
    const fieldGroups = this.fieldsService.fieldGroups();
    const payload = parseFormData(this._formData(), fieldGroups, fieldsInfo);
    return flatCustomFilters(payload);
  }

  loadFromPayload(payload: AreaSearchPayload): void {
    const fieldsInfo = this.fieldsService.getFieldsInfoSync();
    if (!fieldsInfo) {
      return;
    }

    const formData = payloadToFormData(payload, {}, fieldsInfo);
    this._formData.set(formData);
    this.initializedFieldNames = new Set(
      Object.keys(formData).filter(
        (fieldName) => fieldName !== 'omit_saved_records' && fieldName !== 'max_limit'
      )
    );
    this._promotedOafFields.set(this.detectPromotedFields(payload, fieldsInfo));
  }

  private detectPromotedFields(
    payload: AreaSearchPayload,
    fieldsInfo: Record<string, AreaSearchFieldMeta>
  ): Set<string> {
    const promoted = new Set<string>();
    const activeGroup = this.activeFieldGroup();
    const oafNames = new Set((activeGroup?.other_fields ?? []).map((field) => field.field_name));

    for (const fieldName of Object.keys(payload)) {
      if (fieldName === 'searchOptions' || fieldName === 'customFilters' || fieldName === 'geometry') {
        continue;
      }

      if (oafNames.has(fieldName) && fieldsInfo[fieldName]) {
        promoted.add(fieldName);
      }
    }

    if (payload.customFilters) {
      for (const fieldName of Object.keys(payload.customFilters)) {
        if (oafNames.has(fieldName)) {
          promoted.add(fieldName);
        }
      }
    }

    return promoted;
  }
}
