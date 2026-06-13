import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Search123WizardComponent } from '@app/authenticated/search-123/components/search-123-wizard/search-123-wizard.component';
import {
  SEARCH_123_DEFAULT_COUNTY_FIPS,
  SEARCH_123_DEFAULT_STATE_FIPS,
  SEARCH_123_ROUTE
} from '@app/authenticated/search-123/config/search-123.config';
import {
  Search123FormState,
  Search123Service
} from '@app/authenticated/search-123/services/search-123.service';
import { AreaSearchService } from '@app/authenticated/farming/services/area-search.service';
import { AreaSearchSessionService } from '@app/authenticated/farming/services/area-search-session.service';
import { AreaSearchStateService } from '@app/authenticated/farming/services/area-search-state.service';
import { CommonQueriesService } from '@app/authenticated/farming/services/common-queries.service';
import { SavedFarmsService } from '@app/authenticated/farming/services/saved-farms.service';
import { PayNowModalService } from '@app/authenticated/payment/services/pay-now-modal.service';
import { WalletService } from '@app/authenticated/payment/services/wallet.service';
import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
import { CommonAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { GlobalSearchCountData } from '@app/core/interfaces/global-search-response.interface';
import { PayNowResult } from '@app/core/interfaces/payment.interface';
import { PropertyRecordRaw } from '@app/core/interfaces/property-record.interface';
import { SavedFarmRecord } from '@app/core/interfaces/saved-farm.interface';
import { AuthService } from '@app/core/services/auth.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { extractLeadsMeta, mapPropertyRecords } from '@app/core/utils/property-record.mapper';
import { US_STATE_FIPS_BY_ABBREV } from '@app/core/config/us-states.config';
import { CardComponent } from '@app/shared/components';
import { GeographicAreaFieldsValue } from '@app/shared/widgets/geographic-area-fields/geographic-area-fields.types';

@Component({
  selector: 'app-search-123',
  standalone: true,
  imports: [CardComponent, Search123WizardComponent],
  templateUrl: './search-123.component.html'
})
export class Search123Component implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  protected readonly search123Service = inject(Search123Service);
  private readonly areaSearchService = inject(AreaSearchService);
  private readonly sessionService = inject(AreaSearchSessionService);
  private readonly areaSearchStateService = inject(AreaSearchStateService);
  private readonly commonQueriesService = inject(CommonQueriesService);
  private readonly payNowModalService = inject(PayNowModalService);
  private readonly walletService = inject(WalletService);
  private readonly savedFarmsService = inject(SavedFarmsService);
  private readonly authService = inject(AuthService);
  private readonly verticalService = inject(VerticalService);

  private lastSearchPayload: AreaSearchPayload | null = null;

  readonly form = signal<Search123FormState>(this.createDefaultForm());
  readonly selectedQuery = signal<CommonAreaSearchQuery | null>(null);
  readonly searching = signal(false);
  readonly paying = signal(false);
  readonly initializingLocation = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPayNowButton = signal(false);
  readonly countResult = signal<GlobalSearchCountData | null>(null);

  readonly queries = this.commonQueriesService.queries;
  readonly queriesLoading = this.commonQueriesService.loading;
  readonly premierDataEnabled = signal(false);

  readonly payNowPrice = computed(() => {
    const price = this.countResult()?.rec_price;
    return price != null ? Number(price) : null;
  });

  ngOnInit(): void {
    this.premierDataEnabled.set(this.search123Service.isPremierDataLinkEnabled());
    this.commonQueriesService.fetchList();
    this.initializeLocationDefaults();
  }

  ngOnDestroy(): void {
    this.areaSearchService.clearGlobalSearch().subscribe({ error: () => undefined });
  }

  onFormChange(form: Search123FormState): void {
    this.form.set(form);
  }

  onQuerySelect(query: CommonAreaSearchQuery): void {
    this.selectedQuery.set(query);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showPayNowButton.set(false);
  }

  onSearch(): void {
    if (this.searching()) {
      return;
    }

    const form = this.form();
    const limitError = this.search123Service.validateMaxLimit(form.maxLimitCheck, form.maxLimitValue);
    if (limitError) {
      const revised = this.search123Service.revisedMaxLimit(form.maxLimitValue);
      this.form.update((current) => ({ ...current, maxLimitValue: revised }));
      this.errorMessage.set(limitError);
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showPayNowButton.set(false);
    this.searching.set(true);

    const payload = this.buildPayload();
    this.lastSearchPayload = payload;

    if (this.search123Service.isCriteriaPremier(payload)) {
      this.areaSearchService
        .getCount(payload)
        .pipe(finalize(() => this.searching.set(false)))
        .subscribe({
          next: (result) => {
            this.countResult.set(result);
            if (this.search123Service.requiresPayment(result.rec_price)) {
              this.showPaySuccessForPayment(result);
              return;
            }

            this.loadSearchRecords(payload);
          },
          error: (err: Error) => this.handleSearchError(err)
        });
      return;
    }

    this.areaSearchService
      .searchRecords(payload, 1, this.resolveSearchLimit(payload))
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        next: (data) => this.navigateToResults(data.query ?? payload, data.recs ?? [], data.paging_info),
        error: (err: Error) => this.handleSearchError(err)
      });
  }

  onPayNow(): void {
    if (this.paying() || !this.lastSearchPayload) {
      return;
    }

    const result = this.countResult();
    const payload = this.lastSearchPayload;
    const contactInfo = payload.searchOptions?.include_contact_info;

    this.paying.set(true);
    this.payNowModalService
      .open({
        mode: 'recsPurchase',
        priceRequired: Number(result?.rec_price ?? 0),
        recordCount: Number(result?.rec_count ?? result?.total_found ?? 0),
        enableExcelExport: Array.isArray(contactInfo) && contactInfo.length > 0,
        contactIncluded: Array.isArray(contactInfo) && contactInfo.length > 0,
        onSuccess: (purchaseResult) => this.onPurchaseSuccess(purchaseResult)
      })
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe();
  }

  onOpenPremierData(): void {
    const payload = this.buildPayload();
    this.areaSearchStateService.setPremierDataFromSearch123(true);
    this.areaSearchStateService.setEditCriteria(payload);
    void this.router.navigate(['/farming/area-search']);
  }

  private createDefaultForm(): Search123FormState {
    return {
      countyStateCheck: false,
      maxLimitCheck: !!this.verticalService.content()?.app_config?.['limit_per_search'],
      maxLimitValue: this.search123Service.defaultMaxLimitValue(),
      omitSavedRecords: false,
      geographic: {
        stateFips: SEARCH_123_DEFAULT_STATE_FIPS,
        countyFips: SEARCH_123_DEFAULT_COUNTY_FIPS
      }
    };
  }

  private initializeLocationDefaults(): void {
    const stateFips = this.resolveDefaultStateFips();
    const geographic: GeographicAreaFieldsValue = {
      stateFips,
      countyFips: stateFips === SEARCH_123_DEFAULT_STATE_FIPS ? SEARCH_123_DEFAULT_COUNTY_FIPS : undefined
    };

    this.form.update((current) => ({ ...current, geographic }));
    this.initializingLocation.set(false);
  }

  private resolveDefaultStateFips(): string {
    const profileState = this.authService.tbUser()?.state;
    if (typeof profileState === 'string' && profileState.trim()) {
      return US_STATE_FIPS_BY_ABBREV[profileState.trim().toUpperCase()] ?? SEARCH_123_DEFAULT_STATE_FIPS;
    }

    const addressState = this.authService.tbAddress()?.[0]?.state;
    if (typeof addressState === 'string' && addressState.trim()) {
      return US_STATE_FIPS_BY_ABBREV[addressState.trim().toUpperCase()] ?? SEARCH_123_DEFAULT_STATE_FIPS;
    }

    return SEARCH_123_DEFAULT_STATE_FIPS;
  }

  private buildPayload(): AreaSearchPayload {
    return this.search123Service.buildPayload({
      form: this.form(),
      selectedQuery: this.selectedQuery(),
      selectedShape: null
    });
  }

  private loadSearchRecords(payload: AreaSearchPayload): void {
    this.searching.set(true);
    this.areaSearchService
      .searchRecords(payload, 1, this.resolveSearchLimit(payload))
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        next: (data) => this.navigateToResults(data.query ?? payload, data.recs ?? [], data.paging_info),
        error: (err: Error) => this.handleSearchError(err)
      });
  }

  private navigateToResults(
    criteria: AreaSearchPayload,
    rawRecords: PropertyRecordRaw[],
    pagingInfo?: { page?: number; limit?: number; total?: number; total_found?: number; [key: string]: unknown }
  ): void {
    const leadsMeta = extractLeadsMeta(rawRecords);
    const rows = mapPropertyRecords(rawRecords, leadsMeta.leadsAttr, leadsMeta.leadsTypes);
    const sessionId = this.sessionService.createSession({
      title: this.selectedQuery()?.name ?? '123 Search Results',
      criteria,
      rows,
      rawRecords,
      countResult: this.countResult() ?? undefined,
      pagingInfo,
      queryId: this.selectedQuery()?.query_id
    });

    void this.router.navigate(['/detail/query', sessionId], {
      queryParams: { returnUrl: SEARCH_123_ROUTE }
    });
  }

  private showPaySuccessForPayment(result: GlobalSearchCountData): void {
    const totalCount = Number(result.rec_count ?? result.total_found ?? 0);
    const recPrice = Number(result.rec_price ?? 0);
    const perRecordPrice = totalCount > 0 ? (recPrice / totalCount).toFixed(2) : recPrice.toFixed(2);
    const dollarOrCents = Number(perRecordPrice) < 1 ? 'cents' : 'dollar';

    this.successMessage.set(
      `${totalCount} properties match your selected search criteria.<br />` +
        `Records are priced at $${perRecordPrice} ${dollarOrCents} per record.<br />` +
        `Total price for records <strong>$${recPrice.toFixed(2)}</strong><br />` +
        `Click "Pay Now" to continue`
    );
    this.showPayNowButton.set(true);
  }

  private onPurchaseSuccess(result: PayNowResult | null): void {
    if (!result?.savedFarm) {
      return;
    }

    this.walletService.fetchBalance(true);
    this.savedFarmsService.fetchFarmsList(true);
    this.navigateToPurchasedFarm(result.savedFarm);
  }

  private navigateToPurchasedFarm(farm: SavedFarmRecord): void {
    const farmId = farm.farm_id;
    if (farmId == null) {
      return;
    }

    void this.router.navigate(['/detail/farm', farmId], {
      queryParams: { returnUrl: SEARCH_123_ROUTE },
      state: {
        title: farm.name ?? farm.farm_name,
        geometry: farm.geometry
      }
    });
  }

  private handleSearchError(err: Error): void {
    let message = err.message ?? 'Search failed.';
    if (message.includes('Result too large')) {
      message = 'Result too large. Please narrow the search area in <strong>Step 1</strong>';
    }

    this.errorMessage.set(message);
    this.successMessage.set(null);
    this.showPayNowButton.set(false);
  }

  private resolveSearchLimit(payload: AreaSearchPayload): number {
    const maxLimit = payload.searchOptions?.max_limit;
    return maxLimit != null ? Number(maxLimit) : this.search123Service.defaultMaxLimitValue();
  }
}
