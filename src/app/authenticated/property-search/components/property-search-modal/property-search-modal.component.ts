import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';
import { US_STATE_ABBREV_OPTIONS, US_STATE_FIPS_BY_ABBREV } from '@app/core/config/us-states.config';
import {
  AddressSearchFormData,
  AddressSearchHistoryEntry,
  CountyChoice,
  CountyFipsOption,
  OwnerSearchPayload,
  ParcelSearchPayload,
  PropertyAddressType,
  PropertySearchTab
} from '@app/core/interfaces/property-search.interface';
import { SmartyAddressDetails } from '@app/core/interfaces/smarty.interface';
import { PropertySearchModalService } from '@app/authenticated/property-search/services/property-search-modal.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { normalizeCountyForDropdown } from '@app/core/utils/address-format.util';
import { PropertySearchService } from '@app/authenticated/property-search/services/property-search.service';
import { PropertySearchSessionService } from '@app/authenticated/property-search/services/property-search-session.service';
import {
  formatHistoryAddress,
  loadAddressSearchHistory,
  saveAddressSearchHistory
} from '@app/core/utils/property-search-history.util';
import { AlertComponent, ButtonComponent, GeographicAreaFieldsComponent } from '@app/shared/components';
import { AreaSearchControlStyles } from '@app/authenticated/farming/components/area-search-fields/area-search-control.styles';
import { GeographicAreaFieldsValue } from '@app/shared/widgets/geographic-area-fields/geographic-area-fields.types';
import { AddressAutocompleteComponent } from '@app/shared/widgets/address-autocomplete/address-autocomplete.component';
import { TabNavComponent } from '@app/shared/ui/tab-nav/tab-nav.component';
import { TabNavItem } from '@app/shared/ui/tab-nav/tab-nav.types';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';

type SearchStatus = { type: 'success' | 'error'; message: string } | null;
type PropertySearchAccordionSection = 'manual' | 'history' | 'map';

@Component({
  selector: 'app-property-search-modal',
  standalone: true,
  imports: [
    FormsModule,
    ModalComponent,
    AlertComponent,
    ButtonComponent,
    TabNavComponent,
    Select,
    InputText,
    AddressAutocompleteComponent,
    GeographicAreaFieldsComponent
  ],
  templateUrl: './property-search-modal.component.html',
  styles: []
})
export class PropertySearchModalComponent {
  protected readonly controlStyles = AreaSearchControlStyles;

  private readonly router = inject(Router);
  private readonly modalService = inject(PropertySearchModalService);
  private readonly propertySearchService = inject(PropertySearchService);
  private readonly sessionService = inject(PropertySearchSessionService);
  private readonly verticalService = inject(VerticalService);
  private readonly modal = viewChild.required<ModalComponent>('modal');
  private readonly geographicFields = viewChild(GeographicAreaFieldsComponent);

  readonly tabNavItems: TabNavItem[] = [
    { id: 'address', label: 'Address', icon: 'pi pi-map-marker' },
    { id: 'owner', label: 'Owner', icon: 'pi pi-user' },
    { id: 'parcel', label: 'Parcel', icon: 'pi pi-sun' }
  ];

  readonly activeTab = signal<PropertySearchTab>('address');
  readonly stateOptions = US_STATE_ABBREV_OPTIONS;

  readonly addressType = signal<PropertyAddressType>('site_address');
  readonly siteStateForMailing = signal('CA');
  readonly addressForm = signal<AddressSearchFormData>({});
  readonly ownerForm = signal<OwnerSearchPayload>({});
  readonly parcelForm = signal<ParcelSearchPayload>({});

  readonly addressCounties = signal<CountyChoice[]>([]);
  readonly addressStateFips = signal<string | null>(null);
  readonly addressCountyFips = signal<string | undefined>(undefined);

  readonly ownerCountyOptions = signal<CountyFipsOption[]>([]);
  readonly parcelCountyOptions = signal<CountyFipsOption[]>([]);
  readonly fetchingOwnerCounties = signal(false);
  readonly fetchingParcelCounties = signal(false);

  readonly addressHistory = signal<AddressSearchHistoryEntry[]>([]);
  readonly openAccordion = signal<PropertySearchAccordionSection | null>(null);

  readonly addressStatus = signal<SearchStatus>(null);
  readonly ownerStatus = signal<SearchStatus>(null);
  readonly parcelStatus = signal<SearchStatus>(null);

  readonly addressSearching = signal(false);
  readonly ownerSearching = signal(false);
  readonly parcelSearching = signal(false);

  readonly smartyResetToken = signal(0);

  private pendingCountyMatch: { countyName?: string; countyFipsFromFips?: string } | null = null;
  readonly highlightUnitField = signal(false);

  readonly addressGeographicValue = computed(
    (): GeographicAreaFieldsValue => ({
      stateFips: this.addressStateFips() ?? undefined,
      countyFips: this.addressCountyFips(),
      stateAbbrev: this.addressForm().site_state,
      countyLabel: this.addressForm().county,
      siteCity: this.addressForm().site_city,
      siteZip: this.addressForm().site_zip
    })
  );

  private ownerCountyDebounce?: ReturnType<typeof setTimeout>;
  private parcelCountyDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const modal = this.modal();
      if (!modal) {
        return;
      }

      if (this.modalService.isOpen()) {
        modal.open();
        this.initializeModal();
      } else if (modal.isOpen()) {
        modal.close();
      }
    });
  }

  onModalClose(): void {
    this.modalService.close();
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId as PropertySearchTab);
  }

  toggleAccordion(section: PropertySearchAccordionSection): void {
    this.openAccordion.update((current) => (current === section ? null : section));
  }

  isAccordionOpen(section: PropertySearchAccordionSection): boolean {
    return this.openAccordion() === section;
  }

  private openAccordionSection(section: PropertySearchAccordionSection): void {
    this.openAccordion.set(section);
  }

  onAddressGeographicChange(value: GeographicAreaFieldsValue): void {
    const stateFips = value.stateFips ?? null;
    this.addressStateFips.set(stateFips);
    this.addressCountyFips.set(value.countyFips);

    const patch: Partial<AddressSearchFormData> = {
      site_state: value.stateAbbrev ?? this.addressForm().site_state,
      site_city: value.siteCity,
      site_zip: value.siteZip,
      county: value.countyLabel ? normalizeCountyForDropdown(value.countyLabel) : undefined
    };

    if (stateFips && value.countyFips) {
      patch.state_county_fips = `${stateFips}${value.countyFips}`;
    } else if (!value.countyFips) {
      patch.state_county_fips = undefined;
    }

    this.patchAddressForm(patch);

    if (!stateFips) {
      this.addressCounties.set([]);
    }
  }

  onGeographicCountiesChange(counties: CountyChoice[]): void {
    this.addressCounties.set(counties);

    if (!this.pendingCountyMatch) {
      return;
    }

    const countyFips =
      this.pendingCountyMatch.countyFipsFromFips ??
      this.matchCountyFips(counties, this.pendingCountyMatch.countyName);

    this.addressCountyFips.set(countyFips);
    this.pendingCountyMatch = null;
  }

  onOwnerCountyFilter(event: { filter: string }): void {
    const query = event.filter?.trim() ?? '';
    if (this.ownerCountyDebounce) {
      clearTimeout(this.ownerCountyDebounce);
    }

    if (query.length < 3) {
      this.ownerCountyOptions.set([]);
      return;
    }

    this.fetchingOwnerCounties.set(true);
    this.ownerCountyDebounce = setTimeout(() => {
      this.propertySearchService.autocompleteCounties(query).subscribe({
        next: (options) => {
          this.ownerCountyOptions.set(options);
          this.fetchingOwnerCounties.set(false);
        },
        error: () => {
          this.ownerCountyOptions.set([]);
          this.fetchingOwnerCounties.set(false);
        }
      });
    }, 400);
  }

  onParcelCountyFilter(event: { filter: string }): void {
    const query = event.filter?.trim() ?? '';
    if (this.parcelCountyDebounce) {
      clearTimeout(this.parcelCountyDebounce);
    }

    if (query.length < 3) {
      this.parcelCountyOptions.set([]);
      return;
    }

    this.fetchingParcelCounties.set(true);
    this.parcelCountyDebounce = setTimeout(() => {
      this.propertySearchService.autocompleteCounties(query).subscribe({
        next: (options) => {
          this.parcelCountyOptions.set(options);
          this.fetchingParcelCounties.set(false);
        },
        error: () => {
          this.parcelCountyOptions.set([]);
          this.fetchingParcelCounties.set(false);
        }
      });
    }, 400);
  }

  searchAddress(): void {
    const form = this.addressForm();
    const validationError = this.propertySearchService.validateAddressForm(form);

    if (validationError) {
      this.addressStatus.set({ type: 'error', message: validationError });
      this.openAccordionSection('manual');
      return;
    }

    this.addressStatus.set(null);
    this.addressSearching.set(true);

    const addressType = this.addressType();
    const siteStateForMailing = this.siteStateForMailing();
    const counties = this.geographicFields()?.countyOptions() ?? this.addressCounties();
    const stateFips = this.addressStateFips();

    this.propertySearchService
      .searchAddress(form, addressType, siteStateForMailing, counties, stateFips)
      .pipe(finalize(() => this.addressSearching.set(false)))
      .subscribe({
        next: (result) => {
          const payload = this.buildAddressHistoryPayload(form, addressType, siteStateForMailing);
          saveAddressSearchHistory(payload);
          this.addressHistory.set(loadAddressSearchHistory());

          const title = this.buildSearchTitle('address', form);
          this.navigateToResults('address', title, result.records, result.rawRecords, {
            ...payload,
            address_type: addressType,
            siteStateForMailing
          });
        },
        error: (error: Error) => {
          this.addressStatus.set({
            type: 'error',
            message: error.message || 'Could not find the property.'
          });
          this.openAccordionSection('manual');
        }
      });
  }

  searchOwner(): void {
    const form = this.ownerForm();
    const validationError = this.validateOwnerForm(form);

    if (validationError) {
      this.ownerStatus.set({ type: 'error', message: validationError });
      return;
    }

    this.ownerStatus.set(null);
    this.ownerSearching.set(true);

    this.propertySearchService
      .searchOwner(form)
      .pipe(finalize(() => this.ownerSearching.set(false)))
      .subscribe({
        next: (result) => {
          const title = this.buildSearchTitle('owner', form);
          this.navigateToResults('owner', title, result.records, result.rawRecords, form);
        },
        error: (error: Error) => {
          this.ownerStatus.set({
            type: 'error',
            message: error.message || 'Could not find matching properties.'
          });
        }
      });
  }

  searchParcel(): void {
    const form = this.parcelForm();
    const validationError = this.validateParcelForm(form);

    if (validationError) {
      this.parcelStatus.set({ type: 'error', message: validationError });
      return;
    }

    this.parcelStatus.set(null);
    this.parcelSearching.set(true);

    this.propertySearchService
      .searchParcel(form)
      .pipe(finalize(() => this.parcelSearching.set(false)))
      .subscribe({
        next: (result) => {
          const title = this.buildSearchTitle('parcel', form);
          this.navigateToResults('parcel', title, result.records, result.rawRecords, form);
        },
        error: (error: Error) => {
          this.parcelStatus.set({
            type: 'error',
            message: error.message || 'Could not find the property.'
          });
        }
      });
  }

  resetAddressForm(): void {
    this.addressForm.set({});
    this.smartyResetToken.update((token) => token + 1);
    this.addressType.set('site_address');
    this.siteStateForMailing.set('CA');
    this.addressCounties.set([]);
    this.addressStateFips.set(null);
    this.addressCountyFips.set(undefined);
    this.pendingCountyMatch = null;
    this.geographicFields()?.resetFetchCache();
    this.addressStatus.set(null);
    this.openAccordionSection('manual');
  }

  resetOwnerForm(): void {
    this.ownerForm.set({});
    this.ownerCountyOptions.set([]);
    this.ownerStatus.set(null);
  }

  resetParcelForm(): void {
    this.parcelForm.set({});
    this.parcelCountyOptions.set([]);
    this.parcelStatus.set(null);
  }

  selectHistoryEntry(entry: AddressSearchHistoryEntry): void {
    this.addressForm.set({
      site_street_number: entry.site_street_number,
      site_route: entry.site_route,
      site_city: entry.site_city,
      site_state: entry.site_state,
      site_zip: entry.site_zip,
      site_unit: entry.site_unit,
      county: entry.county,
      state_county_fips: entry.state_county_fips
    });

    if (entry.address_type) {
      this.addressType.set(entry.address_type);
    }

    if (entry.siteStateForMailing) {
      this.siteStateForMailing.set(entry.siteStateForMailing);
    }

    this.syncGeographicFromAddressForm(entry.state_county_fips);
    this.openAccordionSection('manual');
    this.activeTab.set('address');
  }

  formatHistoryAddress(entry: AddressSearchHistoryEntry): string {
    return formatHistoryAddress(entry);
  }

  patchAddressForm(patch: Partial<AddressSearchFormData>): void {
    this.addressForm.update((current) => ({ ...current, ...patch }));
  }

  patchOwnerForm(patch: Partial<OwnerSearchPayload>): void {
    this.ownerForm.update((current) => ({ ...current, ...patch }));
  }

  patchParcelForm(patch: Partial<ParcelSearchPayload>): void {
    this.parcelForm.update((current) => ({ ...current, ...patch }));
  }

  canSearchEntireState(): boolean {
    return !!this.ownerForm().state_county_fips;
  }

  onAddressStringChange(event: { query: string; unit?: string }): void {
    if (!event.query) {
      return;
    }

    if (event.unit) {
      this.openAccordionSection('manual');
      this.patchAddressForm({ site_unit: event.unit });
    }
  }

  onSmartyPlaceChanged(details: SmartyAddressDetails): void {
    const county = normalizeCountyForDropdown(details.county);
    const nextForm: AddressSearchFormData = {
      site_street_number: details.site_street_number,
      site_route: details.site_route,
      site_city: details.site_city,
      site_state: details.site_state,
      site_zip: details.site_zip,
      site_unit: details.site_unit,
      county,
      state_county_fips: details.state_county_fips
    };

    this.addressForm.set(nextForm);

    if (details.site_unit) {
      this.highlightUnitField.set(true);
      setTimeout(() => this.highlightUnitField.set(false), 2500);
    }

    this.syncGeographicFromAddressForm(details.state_county_fips);
    this.openAccordionSection('manual');
  }

  smartyVerificationEnabled(): boolean {
    return this.verticalService.smartyVerificationEnabled();
  }

  private syncGeographicFromAddressForm(stateCountyFips?: string): void {
    const form = this.addressForm();
    const stateFips =
      stateCountyFips?.slice(0, 2) ??
      (form.site_state ? US_STATE_FIPS_BY_ABBREV[form.site_state.toUpperCase()] : undefined);
    const countyFipsFromFips = stateCountyFips && stateCountyFips.length > 2
      ? stateCountyFips.slice(2)
      : undefined;

    this.geographicFields()?.resetFetchCache();
    this.addressStateFips.set(stateFips ?? null);

    if (!stateFips) {
      this.addressCountyFips.set(undefined);
      this.addressCounties.set([]);
      this.pendingCountyMatch = null;
      return;
    }

    this.pendingCountyMatch = {
      countyName: form.county,
      countyFipsFromFips
    };

    const counties = this.geographicFields()?.countyOptions() ?? [];
    if (counties.length) {
      this.onGeographicCountiesChange(counties);
    } else if (countyFipsFromFips) {
      this.addressCountyFips.set(countyFipsFromFips);
      this.pendingCountyMatch = null;
    }
  }

  private matchCountyFips(counties: CountyChoice[], countyName?: string): string | undefined {
    if (!countyName?.trim()) {
      return undefined;
    }

    const normalized = normalizeCountyForDropdown(countyName);
    const match = counties.find(
      (county) =>
        county.value.toUpperCase() === normalized ||
        county.value === countyName ||
        county.value.toUpperCase() === countyName.toUpperCase()
    );

    return match?.key;
  }

  private initializeModal(): void {
    const history = loadAddressSearchHistory();
    this.addressHistory.set(history);
    this.openAccordion.set(null);
    this.activeTab.set('address');
    this.addressStatus.set(null);
    this.ownerStatus.set(null);
    this.parcelStatus.set(null);
    this.smartyResetToken.update((token) => token + 1);
  }

  private navigateToResults(
    searchType: PropertySearchTab,
    title: string,
    rows: Record<string, unknown>[],
    rawRecords: Parameters<PropertySearchSessionService['createSession']>[0]['rawRecords'],
    lastPayload: Parameters<PropertySearchSessionService['createSession']>[0]['lastPayload']
  ): void {
    const sessionId = this.sessionService.createSession({
      title,
      searchType,
      rows,
      rawRecords,
      lastPayload
    });

    this.modalService.close();
    this.router.navigate(['/detail/search', sessionId], { state: { title } });
  }

  private buildAddressHistoryPayload(
    form: AddressSearchFormData,
    addressType: PropertyAddressType,
    siteStateForMailing: string
  ): AddressSearchHistoryEntry {
    return {
      ...form,
      address_type: addressType,
      siteStateForMailing,
      searchTime: this.propertySearchService.currentSearchTimestamp()
    };
  }

  private validateOwnerForm(form: OwnerSearchPayload): string | null {
    if (!form.state_county_fips?.trim()) {
      return 'County is required.';
    }

    if (!form.first_name?.trim() && !form.last_name?.trim()) {
      return 'First name or last name is required.';
    }

    if ((form.first_name?.length ?? 0) > 15) {
      return 'First name is too long.';
    }

    if ((form.last_name?.length ?? 0) > 15) {
      return 'Last name is too long.';
    }

    return null;
  }

  private validateParcelForm(form: ParcelSearchPayload): string | null {
    if (!form.parcel_number?.trim()) {
      return 'Parcel number is required.';
    }

    if (!form.state_county_fips?.trim()) {
      return 'County is required.';
    }

    return null;
  }

  private buildSearchTitle(
    tab: PropertySearchTab,
    form: AddressSearchFormData | OwnerSearchPayload | ParcelSearchPayload
  ): string {
    if (tab === 'address') {
      const addressForm = form as AddressSearchFormData;
      const full = this.propertySearchService.buildFullSiteAddress(addressForm);
      return full || 'Address Search';
    }

    if (tab === 'owner') {
      const ownerForm = form as OwnerSearchPayload;
      const name = [ownerForm.first_name, ownerForm.last_name].filter(Boolean).join(' ').trim();
      return name ? `Owner: ${name}` : 'Owner Search';
    }

    const parcelForm = form as ParcelSearchPayload;
    return parcelForm.parcel_number ? `Parcel: ${parcelForm.parcel_number}` : 'Parcel Search';
  }
}
