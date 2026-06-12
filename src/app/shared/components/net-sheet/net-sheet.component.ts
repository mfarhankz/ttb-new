import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  OnDestroy,
  output,
  signal,
  untracked
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { finalize } from 'rxjs';
import {
  BUYER_WORKSHEET_GROUPS,
  NET_SHEET_BROKERAGE_AMOUNT_FIELDS,
  NET_SHEET_BROKERAGE_PERCENT_FIELDS,
  NET_SHEET_DEFAULT_LABELS,
  NET_SHEET_DISPLAY_ONLY_TOTAL_FIELDS,
  NET_SHEET_FEE_DEBOUNCE_MS,
  NET_SHEET_HIDDEN_FIELDS,
  NET_SHEET_REFINANCE_PAYER_CHOICES,
  REFINANCE_GENERAL_INFO_FIELDS,
  REFINANCE_NEW_LOAN_AMOUNT_FIELDS,
  REFINANCE_NEW_LOAN_FIELDS,
  REFINANCE_NEW_LOAN_PERCENT_FIELDS,
  REFINANCE_PAYMENT_FIELDS,
  REFINANCE_PREPAID_FIELDS,
  REFINANCE_SETTLEMENT_PAIR_FIELDS,
  REFINANCE_SETTLEMENT_STANDARD_FIELDS,
  REFINANCE_TOTALS_FIELDS,
  REFINANCE_WORKSHEET_SECTIONS,
  NET_SHEET_LOAN_TYPES,
  NET_SHEET_OTHER_EXPENSE_FIELDS,
  NET_SHEET_PAYER_BASED_FIELDS,
  NET_SHEET_PAYER_CHOICES,
  NET_SHEET_SETTLEMENT_STANDARD_FIELDS,
  NET_SHEET_SKIPPED_SUBTOTAL_FIELDS,
  NET_SHEET_TAB_LABELS,
  NET_SHEET_TABS,
  NET_SHEET_INTERNAL_TOTAL_FIELDS,
  NET_SHEET_TOTAL_FIELD_LABELS,
  NET2SELL_GENERAL_INFO_FIELDS,
  NET2SELL_TOTAL_FIELD_LABELS,
  NET2SELL_TOTALS_DISPLAY_FIELDS,
  SELLER_ENCUMBRANCE_FIELDS,
  SELLER_GENERAL_INFO_FIELDS,
  SELLER_TOTALS_FIELDS,
  SELLER_WORKSHEET_SECTIONS,
  type NetSheetWorksheetSection
} from '@app/core/config/net-sheet.config';
import {
  BlankModePropertyInfo,
  NetSheetConfig,
  NetSheetData,
  NetSheetPayerValues,
  NetSheetTabId,
  NetSheetTabMetaState
} from '@app/core/interfaces/net-sheet.interface';
import {
  NetSheetCalcContext,
  NetSheetCalculationsService
} from '@app/core/services/net-sheet-calculations.service';
import { NetSheetService } from '@app/core/services/net-sheet.service';
import {
  formatNetSheetDate,
  fromInputDateValue,
  netSheetToFixed,
  shouldSkipSubtotalField,
  toInputDateValue
} from '@app/core/utils/net-sheet.util';
import { AlertComponent, ButtonComponent } from '@app/shared/components';
import { AreaSearchControlStyles } from '@app/shared/components/area-search-fields/area-search-control.styles';
import { GeographicAreaFieldsComponent } from '@app/shared/components/geographic-area-fields/geographic-area-fields.component';
import { GeographicAreaFieldsValue } from '@app/shared/components/geographic-area-fields/geographic-area-fields.types';
import { NetSheetMapsComponent } from './net-sheet-maps.component';

@Component({
  selector: 'app-net-sheet',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    InputText,
    Select,
    ButtonComponent,
    AlertComponent,
    GeographicAreaFieldsComponent,
    NetSheetMapsComponent
  ],
  templateUrl: './net-sheet.component.html',
  styleUrl: './net-sheet.component.scss',
  host: {
    class: 'block'
  }
})
export class NetSheetComponent implements OnDestroy {
  protected readonly controlStyles = AreaSearchControlStyles;
  private readonly netSheetService = inject(NetSheetService);
  private readonly calculations = inject(NetSheetCalculationsService);
  readonly config = input.required<NetSheetConfig>();
  readonly siteAddress = model<string>('');
  readonly closed = output<void>();

  readonly loanTypes = [...NET_SHEET_LOAN_TYPES];
  readonly payerChoices = [...NET_SHEET_PAYER_CHOICES];
  readonly refinancePayerChoices = [...NET_SHEET_REFINANCE_PAYER_CHOICES];
  readonly payerBasedFields = [...NET_SHEET_PAYER_BASED_FIELDS];
  readonly worksheetGroups = [...BUYER_WORKSHEET_GROUPS];
  readonly allTabs = NET_SHEET_TABS;

  readonly activeTab = signal<NetSheetTabId>('buyer');
  readonly sheetData = signal<NetSheetData | null>(null);
  readonly blankMode = signal<BlankModePropertyInfo>({ site_address: '' });
  readonly blankOnceLoaded = signal(false);
  readonly nameError = signal(false);
  readonly loading = signal(false);
  readonly fetchingFees = signal(false);
  readonly saving = signal(false);
  readonly printing = signal(false);
  readonly solvingNetGoal = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly statusType = signal<'success' | 'error' | null>(null);
  readonly pdfLink = signal<string | null>(null);

  readonly preparedForName = signal('');
  readonly propertyId = signal<string | undefined>(undefined);

  readonly tabMeta = signal<NetSheetTabMetaState>({
    seller: {},
    net2sell: {},
    refinance: {},
    buyer: {}
  });

  readonly payerValues = signal<NetSheetPayerValues>({
    seller: {},
    net2sell: {},
    refinance: {},
    buyer: {}
  });

  readonly labels = computed(
    () => this.sheetData()?.parsedMeta?.labels.combinedSheet.combinedGroup ?? {}
  );

  readonly activeTabData = computed(
    () => this.sheetData()?.[this.activeTab()] as Record<string, Record<string, unknown>> | undefined
  );
  readonly showWorksheet = computed(
    () => !!this.sheetData() && (!this.config().isBlankMode || this.blankOnceLoaded())
  );
  readonly showPropertyChrome = computed(() => !this.config().isBlankMode && this.showWorksheet());
  readonly useSellerLayout = computed(() => {
    const tab = this.activeTab();
    return tab === 'seller' || tab === 'net2sell';
  });
  readonly isNet2SellTab = computed(() => this.activeTab() === 'net2sell');
  readonly isRefinanceTab = computed(() => this.activeTab() === 'refinance');
  readonly useRefinanceLayout = computed(() => this.isRefinanceTab());
  readonly useStructuredWorksheetLayout = computed(
    () => this.useSellerLayout() || this.useRefinanceLayout()
  );
  readonly showNetSheetDisclaimer = computed(
    () => this.showWorksheet() && (this.activeTab() === 'seller' || this.activeTab() === 'net2sell')
  );
  readonly visibleTabs = computed(() => {
    const cfg = this.config();
    const tabs = NET_SHEET_TABS.map((id) => ({ id, label: NET_SHEET_TAB_LABELS[id].toUpperCase() }));
    if (cfg.isBlankMode) {
      return [];
    }
    if (cfg.savedMode) {
      const active = this.activeTab();
      return tabs.filter((tab) => tab.id === active);
    }
    return tabs;
  });
  readonly worksheetRows = computed(() => {
    const sections = this.worksheetSections();
    return [...new Set(sections.map((section) => section.row))].sort((a, b) => a - b);
  });
  readonly showSaveButton = computed(() => this.activeTab() !== 'net2sell' && !this.config().viewMode);

  readonly headlineAddress = computed(() => {
    const cfg = this.config();
    if (cfg.isBlankMode) {
      return this.blankMode().site_address?.trim() || 'Buyer Cost Estimate';
    }

    return cfg.propertyAddress?.trim() || 'Net Sheet';
  });

  readonly blankGeographicValue = computed(
    (): GeographicAreaFieldsValue => ({
      stateFips: this.blankMode().state_fips,
      countyFips: this.blankMode().county_fips,
      siteCity: this.blankMode().site_city,
      siteZip: this.blankMode().site_zip
    })
  );

  private feeDebounce?: ReturnType<typeof setTimeout>;
  private initializedForKey = '';

  constructor() {
    effect(() => {
      const cfg = this.config();
      const key = this.configKey(cfg);
      if (key === this.initializedForKey) {
        return;
      }

      untracked(() => {
        this.initializedForKey = key;
        this.resetState();
        this.preparedForName.set(cfg.preparedForName ?? '');
        this.activeTab.set(cfg.isBlankMode ? 'buyer' : cfg.activeTabFieldName ?? 'seller');
        this.bootstrap(cfg);
      });
    });

    effect(() => {
      if (!this.config().isBlankMode || !this.config().blankNameInHeader) {
        return;
      }

      const addr = this.siteAddress();
      untracked(() => {
        if ((this.blankMode().site_address ?? '') !== addr) {
          this.blankMode.update((current) => ({ ...current, site_address: addr }));
        }
      });
    });

  }

  ngOnDestroy(): void {
    if (this.feeDebounce) {
      clearTimeout(this.feeDebounce);
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  selectTab(tabId: NetSheetTabId): void {
    if (this.config().savedMode || this.activeTab() === tabId) {
      return;
    }

    this.activeTab.set(tabId);
    const data = this.sheetData();
    if (data) {
      this.calculations.recalculateActiveTab(data, { ...this.calcContext(), activeTab: tabId });
      this.sheetData.set(structuredClone(data));
    }
    this.scheduleFeeRefresh();
  }

  tabLabel(tabId: NetSheetTabId): string {
    return NET_SHEET_TAB_LABELS[tabId].toUpperCase();
  }

  leftWorksheetSections(): NetSheetWorksheetSection[] {
    return this.worksheetSections()
      .filter((section) => section.column === 'left')
      .sort((a, b) => a.row - b.row);
  }

  rightWorksheetSections(): NetSheetWorksheetSection[] {
    return this.worksheetSections()
      .filter((section) => section.column === 'right')
      .sort((a, b) => a.row - b.row);
  }

  worksheetSections(): NetSheetWorksheetSection[] {
    if (this.useRefinanceLayout()) {
      return REFINANCE_WORKSHEET_SECTIONS;
    }

    if (this.useSellerLayout()) {
      return SELLER_WORKSHEET_SECTIONS;
    }

    return this.worksheetGroups
      .filter((groupName) => (this.activeTabData()?.[groupName] ?? null) != null)
      .map((groupName, index) => ({
        title: groupName,
        groupName,
        column: (index % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
        row: Math.floor(index / 2) + 1
      }));
  }

  sectionsInRow(row: number): NetSheetWorksheetSection[] {
    return this.worksheetSections().filter((section) => section.row === row);
  }

  leftSectionsInRow(row: number): NetSheetWorksheetSection[] {
    return this.sectionsInRow(row).filter((section) => section.column === 'left');
  }

  rightSectionsInRow(row: number): NetSheetWorksheetSection[] {
    return this.sectionsInRow(row).filter((section) => section.column === 'right');
  }

  formatCurrency(value: unknown): string {
    const amount = Number(value) || 0;
    return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }

  isDisplayOnlyField(groupName: string, fieldName: string): boolean {
    if (groupName === 'Totals' && this.isRefinanceTab()) {
      return (REFINANCE_TOTALS_FIELDS as readonly string[]).includes(fieldName);
    }

    if (groupName !== 'Totals') {
      return false;
    }

    if (this.isNet2SellTab()) {
      return (NET2SELL_TOTALS_DISPLAY_FIELDS as readonly string[]).includes(fieldName);
    }

    if (NET_SHEET_DISPLAY_ONLY_TOTAL_FIELDS.has(fieldName)) {
      return true;
    }

    return fieldName.startsWith('Subtotal');
  }

  isBrokerageAmountField(fieldName: string): boolean {
    return (NET_SHEET_BROKERAGE_AMOUNT_FIELDS as readonly string[]).includes(fieldName);
  }

  isNewLoanAmountField(fieldName: string): boolean {
    return (REFINANCE_NEW_LOAN_AMOUNT_FIELDS as readonly string[]).includes(fieldName);
  }

  isSettlementPairField(fieldName: string): boolean {
    return (REFINANCE_SETTLEMENT_PAIR_FIELDS as readonly string[]).includes(fieldName);
  }

  isPrepaidReadOnlyField(fieldName: string): boolean {
    return (
      fieldName === 'Amount of Taxes for x Months' ||
      fieldName === 'Amount of Insurance for x Months' ||
      fieldName === 'Amount of Interest for x Days'
    );
  }

  isPmiPercentField(fieldName: string): boolean {
    return fieldName === 'PMI Percent';
  }

  pmiAmountField(): string {
    return 'Monthly PMI';
  }

  settlementPercentField(fieldName: string): string {
    return `${fieldName} Percent`;
  }

  activePayerChoices(): readonly { value: string; label: string }[] {
    return this.isRefinanceTab() ? this.refinancePayerChoices : this.payerChoices;
  }

  brokeragePercentField(fieldName: string): string | null {
    return NET_SHEET_BROKERAGE_PERCENT_FIELDS[fieldName] ?? null;
  }

  newLoanPercentField(fieldName: string): string | null {
    return REFINANCE_NEW_LOAN_PERCENT_FIELDS[fieldName] ?? null;
  }

  sectionSubtotalValue(section: NetSheetWorksheetSection): string | null {
    if (!section.subtotalField) {
      return null;
    }

    const value = this.activeTabData()?.['Totals']?.[section.subtotalField];
    return value != null ? this.formatCurrency(value) : null;
  }

  subtotalLabel(section: NetSheetWorksheetSection): string {
    if (section.subtotalField === 'Total New Loans Combined') {
      return 'Total New Loans Combined';
    }

    if (section.subtotalField === 'Estimate Monthly Payment') {
      return 'Est. Monthly Payment';
    }

    if (section.subtotalField === 'Total Prepaid Items') {
      return 'Total Prepaid Items';
    }

    switch (section.groupName) {
      case 'Settlement Services':
        return 'Subtotal - Closing Cost';
      case 'Other Expenses':
        return 'Subtotal - Other Cost';
      case 'Brokerage Fees':
        return 'Subtotal - Brokerage Fee';
      case 'Encumbrances':
        return 'Subtotal - Encumbrances';
      default:
        return `Subtotal - ${section.title}`;
    }
  }

  onBlankGeographicChange(value: GeographicAreaFieldsValue): void {
    this.blankMode.update((current) => ({
      ...current,
      state_fips: value.stateFips,
      county_fips: value.countyFips,
      site_city: value.siteCity,
      site_zip: value.siteZip
    }));
  }

  updateBlankSiteAddress(address: string): void {
    this.blankMode.update((current) => ({ ...current, site_address: address }));
    this.siteAddress.set(address);
  }

  calculateBlankNetSheet(): void {
    if (!this.blankMode().site_address?.trim()) {
      this.nameError.set(true);
      return;
    }

    this.nameError.set(false);
    this.fetchBlankNetSheet();
  }

  onSalesPriceChange(): void {
    this.scheduleFeeRefresh();
  }

  onLoanTypeChange(): void {
    this.scheduleFeeRefresh(true);
  }

  onFieldChange(): void {
    const data = this.sheetData();
    if (!data) {
      return;
    }

    this.calculations.recalculateActiveTab(data, this.calcContext());
    this.sheetData.set(structuredClone(data));
  }

  onPayerChange(fieldName: string, payer: string): void {
    const data = this.sheetData();
    const tabId = this.activeTab();
    if (!data?.[tabId]) {
      return;
    }

    const tabData = data[tabId] as Record<string, Record<string, unknown>>;
    tabData['Settlement Services'] = tabData['Settlement Services'] ?? {};
    tabData['Settlement Services'][`${fieldName} Payer`] = payer;

    this.calculations.onPayerChange(data, this.calcContext(), fieldName, payer);
    this.payerValues.update((current) => ({
      ...current,
      [tabId]: this.calculations.getPayerValuesForTab(data, tabId)
    }));
    this.sheetData.set(structuredClone(data));
  }

  saveActiveTab(): void {
    if (!this.validateBlankName()) {
      return;
    }

    const data = this.sheetData();
    const tab = this.activeTab();
    if (!data?.[tab]) {
      return;
    }

    const payload: Record<string, unknown> = {};
    if (this.config().isBlankMode) {
      payload['mock_property_info'] = { ...this.blankMode() };
    }
    if (this.propertyId()) {
      payload['property_id'] = this.propertyId();
    }

    const tabPayload = structuredClone(data[tab]) as Record<string, unknown>;
    const settlement = (tabPayload['Settlement Services'] ?? {}) as Record<string, unknown>;
    for (const fieldName of NET_SHEET_PAYER_BASED_FIELDS) {
      const stored = this.payerValues()[tab][fieldName];
      if (stored !== undefined && settlement[fieldName] !== undefined) {
        settlement[fieldName] = stored;
      }
    }
    tabPayload['Settlement Services'] = settlement;

    const meta = this.tabMeta()[tab];
    if (meta.netsheet_id) {
      payload['netsheet_id'] = meta.netsheet_id;
    }
    payload[tab] = tabPayload;
    if (this.preparedForName().trim()) {
      payload['prepared_for'] = this.preparedForName().trim();
    }

    this.saving.set(true);
    this.statusMessage.set(null);
    this.netSheetService
      .saveNetSheetTab(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (result) => {
          this.tabMeta.update((current) => ({
            ...current,
            [tab]: {
              netsheet_id: result.netsheet_id ?? current[tab].netsheet_id,
              time_saved: result.time_saved ?? current[tab].time_saved
            }
          }));
          this.statusType.set('success');
          this.statusMessage.set(result.msg ?? 'Net sheet saved successfully.');
        },
        error: (err: Error) => {
          this.statusType.set('error');
          this.statusMessage.set(err.message ?? 'Failed to save net sheet.');
        }
      });
  }

  printActiveTab(): void {
    if (!this.validateBlankName()) {
      return;
    }

    const data = this.sheetData();
    const tab = this.activeTab();
    if (!data?.[tab]) {
      return;
    }

    const payload: Record<string, unknown> = {};
    if (this.config().isBlankMode) {
      payload['mock_property_info'] = { ...this.blankMode() };
    }
    if (this.propertyId()) {
      payload['property_id'] = this.propertyId();
    }
    payload[tab] = structuredClone(data[tab]);
    if (this.preparedForName().trim()) {
      payload['prepared_for'] = this.preparedForName().trim();
    }

    this.printing.set(true);
    this.pdfLink.set(null);
    this.netSheetService
      .printNetSheetPdf(payload)
      .pipe(finalize(() => this.printing.set(false)))
      .subscribe({
        next: (link) => {
          this.pdfLink.set(link);
          this.statusType.set('success');
          this.statusMessage.set('PDF ready.');
        },
        error: (err: Error) => {
          this.statusType.set('error');
          this.statusMessage.set(err.message ?? 'Failed to generate PDF.');
        }
      });
  }

  labelFor(fieldName: string): string {
    return this.labels()[fieldName] ?? NET_SHEET_DEFAULT_LABELS[fieldName] ?? fieldName;
  }

  displayLabelFor(groupName: string, fieldName: string): string {
    if (
      this.isRefinanceTab() &&
      groupName === 'General Info' &&
      fieldName === 'Sales Price'
    ) {
      return 'Estimated Appraised Value';
    }

    if (this.isNet2SellTab() && groupName === 'Totals' && NET2SELL_TOTAL_FIELD_LABELS[fieldName]) {
      return NET2SELL_TOTAL_FIELD_LABELS[fieldName];
    }

    if (groupName === 'Totals' && NET_SHEET_TOTAL_FIELD_LABELS[fieldName]) {
      return NET_SHEET_TOTAL_FIELD_LABELS[fieldName];
    }

    if (groupName === 'Totals' && fieldName === 'LESS Tax Proration') {
      const value = Number(this.fieldValue(groupName, fieldName)) || 0;
      return value < 0 ? 'CREDIT Tax Proration' : 'LESS Tax Proration';
    }

    return this.labelFor(fieldName);
  }

  isGreenCurrencyField(groupName: string, fieldName: string): boolean {
    if (!this.isNet2SellTab()) {
      return false;
    }

    if (fieldName === 'Net Goal For Seller') {
      return true;
    }

    return groupName === 'Encumbrances';
  }

  net2SellSalesPrice(): string {
    return this.formatCurrency(this.activeTabData()?.['General Info']?.['Sales Price']);
  }

  onNetGoalGo(): void {
    const data = this.sheetData();
    if (!data?.net2sell) {
      return;
    }

    const netGoal = Number(
      (data.net2sell as Record<string, Record<string, unknown>>)['General Info']?.['Net Goal For Seller']
    );
    if (!netGoal) {
      return;
    }

    this.solvingNetGoal.set(true);
    try {
      const ctx = this.calcContext();
      const salesPrice = this.calculations.findTargetSalesPriceForNet2Sell(data, ctx);
      if (!salesPrice) {
        this.statusType.set('error');
        this.statusMessage.set('Could not solve a sales price for the entered net goal.');
        return;
      }

      const tabData = data.net2sell as Record<string, Record<string, unknown>>;
      tabData['General Info'] = tabData['General Info'] ?? {};
      tabData['General Info']['Sales Price'] = netSheetToFixed(salesPrice);
      this.calculations.runSellerInitialCalculation(data, { ...ctx, activeTab: 'net2sell' });
      this.sheetData.set(structuredClone(data));
      this.scheduleFeeRefresh();
    } finally {
      this.solvingNetGoal.set(false);
    }
  }

  isPayerBasedField(fieldName: string): boolean {
    return this.payerBasedFields.includes(fieldName as (typeof NET_SHEET_PAYER_BASED_FIELDS)[number]);
  }

  isCurrencyField(fieldName: string, groupName: string): boolean {
    if (this.isDateField(fieldName) || this.isDisplayOnlyField(groupName, fieldName)) {
      return false;
    }

    if (/address|fips|id|type|terms/i.test(fieldName)) {
      return false;
    }

    if (groupName === 'Totals') {
      return fieldName.startsWith('LESS');
    }

    return !fieldName.includes('Percent') && !fieldName.includes('Rate');
  }

  isDateField(fieldName: string): boolean {
    return fieldName.includes('Date');
  }

  isReadOnlyField(groupName: string, fieldName: string): boolean {
    if (fieldName.includes('Amount of')) {
      return true;
    }

    return this.isDisplayOnlyField(groupName, fieldName);
  }

  shouldRenderField(groupName: string, fieldName: string, tabData: Record<string, Record<string, unknown>>): boolean {
    if (NET_SHEET_HIDDEN_FIELDS.has(fieldName)) {
      return false;
    }

    if (shouldSkipSubtotalField(fieldName)) {
      return false;
    }

    if ((NET_SHEET_SKIPPED_SUBTOTAL_FIELDS as readonly string[]).includes(fieldName)) {
      return false;
    }

    if (fieldName.endsWith(' Payer')) {
      return false;
    }

    if (fieldName.endsWith(' Sales Tax') && !NET_SHEET_PAYER_BASED_FIELDS.some((f) => fieldName.startsWith(f))) {
      return false;
    }

    if (groupName === 'Settlement Services' && NET_SHEET_PAYER_BASED_FIELDS.includes(fieldName as typeof NET_SHEET_PAYER_BASED_FIELDS[number])) {
      return false;
    }

    if (groupName === 'General Info' && this.config().isBlankMode && fieldName === 'Sales Price') {
      return false;
    }

    if (groupName === 'General Info' && this.isNet2SellTab() && fieldName === 'Sales Price') {
      return false;
    }

    if (groupName === 'Totals' && NET_SHEET_INTERNAL_TOTAL_FIELDS.has(fieldName)) {
      return false;
    }

    if (groupName === 'Totals' && fieldName.startsWith('Subtotal')) {
      return false;
    }

    if (groupName === 'Totals' && this.isNet2SellTab()) {
      return (NET2SELL_TOTALS_DISPLAY_FIELDS as readonly string[]).includes(fieldName);
    }

    if (groupName === 'Totals' && this.isRefinanceTab()) {
      return (REFINANCE_TOTALS_FIELDS as readonly string[]).includes(fieldName);
    }

    if (
      groupName === 'General Info' &&
      this.isNet2SellTab() &&
      (NET2SELL_GENERAL_INFO_FIELDS as readonly string[]).includes(fieldName)
    ) {
      return true;
    }

    if (
      groupName === 'General Info' &&
      this.isRefinanceTab() &&
      (REFINANCE_GENERAL_INFO_FIELDS as readonly string[]).includes(fieldName)
    ) {
      return true;
    }

    if (groupName === 'New Loan' && fieldName.includes('Percent')) {
      return false;
    }

    if (groupName === 'Payment' && fieldName === 'Monthly PMI') {
      return false;
    }

    if (
      groupName === 'Settlement Services' &&
      this.isRefinanceTab() &&
      fieldName.endsWith(' Percent') &&
      (REFINANCE_SETTLEMENT_PAIR_FIELDS as readonly string[]).includes(fieldName.replace(' Percent', ''))
    ) {
      return false;
    }

    return tabData[groupName]?.[fieldName] !== undefined;
  }

  groupEntries(groupName: string): string[] {
    const tab = this.activeTabData();
    if (!tab?.[groupName]) {
      return [];
    }

    const ordered = this.orderedFieldsForGroup(groupName);
    const candidates =
      this.useStructuredWorksheetLayout() || ordered.length
        ? ordered
        : Object.keys(tab[groupName]);

    return candidates.filter((fieldName) => {
      if (groupName === 'Brokerage Fees' && fieldName.includes('Percent')) {
        return false;
      }

      return this.shouldRenderField(groupName, fieldName, tab);
    });
  }

  private orderedFieldsForGroup(groupName: string): string[] {
    if (this.useRefinanceLayout()) {
      switch (groupName) {
        case 'General Info':
          return [...REFINANCE_GENERAL_INFO_FIELDS];
        case 'Encumbrances':
          return [...SELLER_ENCUMBRANCE_FIELDS];
        case 'Settlement Services':
          return this.orderedRefinanceSettlementFields();
        case 'New Loan':
          return [...REFINANCE_NEW_LOAN_FIELDS];
        case 'Payment':
          return [...REFINANCE_PAYMENT_FIELDS];
        case 'Prepaid':
          return [...REFINANCE_PREPAID_FIELDS];
        case 'Totals':
          return [...REFINANCE_TOTALS_FIELDS];
        default:
          return [];
      }
    }

    if (!this.useSellerLayout()) {
      return [];
    }

    const isNet2Sell = this.isNet2SellTab();

    switch (groupName) {
      case 'General Info':
        return isNet2Sell ? [...NET2SELL_GENERAL_INFO_FIELDS] : [...SELLER_GENERAL_INFO_FIELDS];
      case 'Encumbrances':
        return [...SELLER_ENCUMBRANCE_FIELDS];
      case 'Totals':
        return isNet2Sell ? [...NET2SELL_TOTALS_DISPLAY_FIELDS] : [...SELLER_TOTALS_FIELDS];
      case 'Brokerage Fees':
        return [...NET_SHEET_BROKERAGE_AMOUNT_FIELDS];
      case 'Settlement Services':
        return this.orderedSettlementFields();
      case 'Other Expenses':
        return [...NET_SHEET_OTHER_EXPENSE_FIELDS];
      default:
        return [];
    }
  }

  private orderedRefinanceSettlementFields(): string[] {
    const settlement = this.activeTabData()?.['Settlement Services'] ?? {};
    const ordered: string[] = [
      ...NET_SHEET_PAYER_BASED_FIELDS,
      ...REFINANCE_SETTLEMENT_STANDARD_FIELDS,
      ...REFINANCE_SETTLEMENT_PAIR_FIELDS
    ];
    const known = new Set([
      ...ordered,
      ...REFINANCE_SETTLEMENT_PAIR_FIELDS.flatMap((field) => [`${field} Percent`, field])
    ]);

    const extras = Object.keys(settlement).filter(
      (fieldName) =>
        !known.has(fieldName) &&
        !fieldName.endsWith(' Payer') &&
        !fieldName.endsWith(' Sales Tax') &&
        !fieldName.includes('Percent')
    );

    return [...ordered, ...extras];
  }

  private orderedSettlementFields(): string[] {
    const settlement = this.activeTabData()?.['Settlement Services'] ?? {};
    const ordered: string[] = [...NET_SHEET_PAYER_BASED_FIELDS, ...NET_SHEET_SETTLEMENT_STANDARD_FIELDS];
    const known = new Set(ordered);

    const extras = Object.keys(settlement).filter(
      (fieldName) =>
        !known.has(fieldName) &&
        !fieldName.endsWith(' Payer') &&
        !fieldName.endsWith(' Sales Tax') &&
        !fieldName.includes('Percent')
    );

    return [...ordered, ...extras];
  }

  fieldValue(groupName: string, fieldName: string): unknown {
    return this.activeTabData()?.[groupName]?.[fieldName];
  }

  updateField(groupName: string, fieldName: string, value: unknown): void {
    const data = this.sheetData();
    const tabId = this.activeTab();
    if (!data?.[tabId]) {
      return;
    }

    const tabData = data[tabId] as Record<string, Record<string, unknown>>;
    tabData[groupName] = tabData[groupName] ?? {};
    tabData[groupName][fieldName] = this.isCurrencyField(fieldName, groupName)
      ? netSheetToFixed(value)
      : value;

    if (groupName === 'General Info' && fieldName === 'Sales Price') {
      this.onSalesPriceChange();
      return;
    }

    if (groupName === 'New Loan' && fieldName === 'First Loan Type') {
      this.onLoanTypeChange();
      return;
    }

    if (groupName === 'Brokerage Fees' && fieldName.includes('Percent')) {
      this.calculations.onBrokeragePercentChange(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    if (groupName === 'Brokerage Fees') {
      this.calculations.onBrokerageValueChange(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    if (groupName === 'New Loan' && fieldName.includes('Percent')) {
      this.calculations.onNewLoanPercentChange(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      this.scheduleFeeRefresh();
      return;
    }

    if (groupName === 'New Loan' && this.isNewLoanAmountField(fieldName)) {
      this.calculations.onNewLoanValueChange(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      this.scheduleFeeRefresh();
      return;
    }

    if (groupName === 'New Loan') {
      this.calculations.recalculateActiveTab(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    if (groupName === 'Settlement Services' && fieldName.includes('Percent')) {
      this.calculations.recalculateActiveTab(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    if (groupName === 'Payment' && fieldName === 'PMI Percent') {
      this.calculations.recalculateActiveTab(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    if (groupName === 'Prepaid') {
      this.calculations.recalculateActiveTab(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    if (groupName === 'Encumbrances') {
      this.calculations.onEncumbranceChange(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    if (groupName === 'Totals' && fieldName.startsWith('LESS')) {
      this.calculations.recalculateActiveTab(data, this.calcContext());
      this.sheetData.set(structuredClone(data));
      return;
    }

    this.onFieldChange();
  }

  dateFieldValue(groupName: string, fieldName: string): string {
    return toInputDateValue(this.fieldValue(groupName, fieldName));
  }

  updateDateField(groupName: string, fieldName: string, value: string): void {
    const date = fromInputDateValue(value);
    this.updateField(groupName, fieldName, date);
  }

  payerFieldValue(fieldName: string): string {
    const settlement = this.activeTabData()?.['Settlement Services'];
    return String(settlement?.[`${fieldName} Payer`] ?? 'buyer');
  }

  private bootstrap(cfg: NetSheetConfig): void {
    if (cfg.isBlankMode) {
      const address = cfg.propertyAddress ?? this.siteAddress() ?? '';
      this.blankMode.set({ site_address: address });
      this.siteAddress.set(address);

      const buyerStub: NetSheetData = {
        buyer: {
          'New Loan': { 'First Loan Type': NET_SHEET_LOAN_TYPES[0].value },
          'General Info': { 'Sales Price': 0 }
        }
      };
      this.sheetData.set(buyerStub);

      if (cfg.savedMode && cfg.propertyId) {
        this.propertyId.set(cfg.propertyId);
        this.loadPropertyNetSheet(true);
        return;
      }

      return;
    }

    if (cfg.propertyId) {
      this.propertyId.set(cfg.propertyId);
      this.loadPropertyNetSheet(false);
    }
  }

  private loadPropertyNetSheet(forcePropertyId: boolean): void {
    const cfg = this.config();
    const payload: Record<string, unknown> = {};

    if (cfg.isBlankMode && !forcePropertyId) {
      payload['mock_property_info'] = { ...this.blankMode() };
    } else if (this.propertyId()) {
      payload['property_id'] = this.propertyId();
    }

    this.loading.set(true);
    this.error.set(null);
    this.netSheetService
      .fetchNetSheet(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.applyFetchedData(data, cfg),
        error: (err: Error) => this.error.set(err.message ?? 'Failed to load net sheet.')
      });
  }

  private fetchBlankNetSheet(): void {
    const payload = { mock_property_info: { ...this.blankMode() } };
    this.loading.set(true);
    this.error.set(null);

    this.netSheetService
      .fetchNetSheet(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const salesPrice = Number(
            (data.buyer as Record<string, Record<string, unknown>>)?.['General Info']?.['Sales Price'] ?? 0
          );
          const loanType = String(
            (data.buyer as Record<string, Record<string, unknown>>)?.['New Loan']?.['First Loan Type'] ??
              NET_SHEET_LOAN_TYPES[0].value
          );

          if (this.sheetData()?.buyer) {
            const stubBuyer = this.sheetData()!.buyer as Record<string, Record<string, unknown>>;
            const stubSales = Number(stubBuyer['General Info']?.['Sales Price']);
            if (stubSales > 0) {
              (data.buyer as Record<string, Record<string, unknown>>)['General Info']['Sales Price'] = stubSales;
            }
            const stubLoan = stubBuyer['New Loan']?.['First Loan Type'];
            if (stubLoan) {
              (data.buyer as Record<string, Record<string, unknown>>)['New Loan']['First Loan Type'] = stubLoan;
            } else {
              (data.buyer as Record<string, Record<string, unknown>>)['New Loan']['First Loan Type'] = loanType;
            }
          }

          this.applyFetchedData(data, this.config());
          this.blankOnceLoaded.set(true);
          this.refreshVariableFees(false);
        },
        error: (err: Error) => this.error.set(err.message ?? 'Failed to calculate net sheet.')
      });
  }

  private applyFetchedData(data: NetSheetData, cfg: NetSheetConfig): void {
    const metaState: NetSheetTabMetaState = {
      seller: {},
      net2sell: {},
      refinance: {},
      buyer: {}
    };

    for (const tab of ['seller', 'net2sell', 'refinance', 'buyer'] as NetSheetTabId[]) {
      const extracted = this.netSheetService.extractTabMeta(data, tab);
      data[tab] = extracted.tabData as NetSheetData[typeof tab];
      metaState[tab] = extracted.meta;
    }

    const buyerGeneral = (data.buyer as Record<string, Record<string, unknown>>)?.['General Info'];
    const propertyId = String(buyerGeneral?.['SA_PROPERTY_ID'] ?? cfg.propertyId ?? '');
    if (propertyId) {
      this.propertyId.set(propertyId);
    }

    if (data.mock_property_info) {
      this.blankMode.set({ ...data.mock_property_info });
      this.siteAddress.set(data.mock_property_info.site_address ?? '');
      this.blankOnceLoaded.set(true);
    }

    this.tabMeta.set(metaState);
    this.sheetData.set(data);
    this.calculations.syncPayerValues(data, this.activeTab());
    this.payerValues.set(this.readPayerValues(data));

    const ctx = this.calcContext();
    if (this.activeTab() === 'buyer' || cfg.isBlankMode) {
      this.calculations.runBuyerInitialCalculation(data, ctx);
    } else if (this.activeTab() === 'refinance') {
      this.calculations.runRefinanceInitialCalculation(data, ctx);
    } else if (this.activeTab() === 'seller' || this.activeTab() === 'net2sell') {
      this.calculations.runSellerInitialCalculation(data, ctx);
    }

    this.sheetData.set(structuredClone(data));
  }

  private refreshVariableFees(suppressLoanValue: boolean): void {
    const data = this.sheetData();
    if (!data) {
      return;
    }

    const tab = this.activeTab();
    const tabData = data[tab] as Record<string, Record<string, unknown>>;
    const general = tabData['General Info'] ?? {};
    const payload: Record<string, unknown> = {
      sale_price: Number(general['Sales Price']) || 0,
      netsheet_type: tab
    };

    if (this.config().isBlankMode) {
      payload['mock_property_info'] = { ...this.blankMode() };
    } else if (this.propertyId()) {
      payload['property_id'] = this.propertyId();
    }

    if (tab === 'buyer' || tab === 'refinance') {
      if (!suppressLoanValue) {
        payload['loan_amount'] = Number(tabData['Totals']?.['Total New Loans Combined']) || 0;
      }
      if (tab === 'buyer') {
        payload['loan_type'] = tabData['New Loan']?.['First Loan Type'];
      }
    }

    if (tab === 'seller' || tab === 'net2sell') {
      payload['netsheet_type'] = 'seller';
      payload['annual_tax'] = Number(general['Current Annual Taxes']) || 0;
      const closing = general['Estimated Closing Date'];
      if (closing instanceof Date) {
        payload['estimated_closing_date'] = formatNetSheetDate(closing);
      }
    }

    this.fetchingFees.set(true);
    this.netSheetService
      .fetchVariableFees(payload as never)
      .pipe(finalize(() => this.fetchingFees.set(false)))
      .subscribe({
        next: (fees) => {
          const current = this.sheetData();
          if (!current) {
            return;
          }

          this.calculations.applyVariableFees(current, this.calcContext(), fees);
          this.sheetData.set(structuredClone(current));
        },
        error: (err: Error) => {
          this.statusType.set('error');
          this.statusMessage.set(err.message ?? 'Failed to refresh fees.');
        }
      });
  }

  private scheduleFeeRefresh(suppressLoanValue = false): void {
    if (this.feeDebounce) {
      clearTimeout(this.feeDebounce);
    }

    this.feeDebounce = setTimeout(() => this.refreshVariableFees(suppressLoanValue), NET_SHEET_FEE_DEBOUNCE_MS);
  }

  private calcContext(): NetSheetCalcContext {
    const tab = this.activeTab();
    const loanType = String(this.activeTabData()?.['New Loan']?.['First Loan Type'] ?? '');
    return {
      activeTab: tab,
      isBlankMode: this.config().isBlankMode,
      isLoanTypeAllCash: loanType === 'ALL_CASH',
      payerValues: this.payerValues()
    };
  }

  private readPayerValues(data: NetSheetData): NetSheetPayerValues {
    return {
      seller: this.calculations.getPayerValuesForTab(data, 'seller'),
      net2sell: this.calculations.getPayerValuesForTab(data, 'net2sell'),
      refinance: this.calculations.getPayerValuesForTab(data, 'refinance'),
      buyer: this.calculations.getPayerValuesForTab(data, 'buyer')
    };
  }

  private validateBlankName(): boolean {
    if (!this.config().isBlankMode) {
      return true;
    }

    if (!this.blankMode().site_address?.trim()) {
      this.nameError.set(true);
      return false;
    }

    this.nameError.set(false);
    return true;
  }

  private resetState(): void {
    this.sheetData.set(null);
    this.blankOnceLoaded.set(false);
    this.nameError.set(false);
    this.loading.set(false);
    this.fetchingFees.set(false);
    this.saving.set(false);
    this.printing.set(false);
    this.error.set(null);
    this.statusMessage.set(null);
    this.statusType.set(null);
    this.pdfLink.set(null);
    this.propertyId.set(undefined);
    this.blankMode.set({ site_address: '' });
  }

  private configKey(cfg: NetSheetConfig): string {
    return JSON.stringify({
      isBlankMode: cfg.isBlankMode,
      savedMode: cfg.savedMode,
      propertyId: cfg.propertyId,
      netSheetId: cfg.netSheetId,
      activeTabFieldName: cfg.activeTabFieldName
    });
  }
}
