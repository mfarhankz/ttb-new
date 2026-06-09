import { JsonPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { AlertComponent, ButtonComponent, CardComponent, ModalComponent } from '@app/shared/components';
import { AreaSearchFieldComponent } from '@app/shared/components/area-search-fields/area-search-field.component';
import { AreaSearchOafAccordionComponent } from '@app/shared/components/area-search-fields/oaf-accordion.component';
import { AreaSearchPremierNoteComponent } from '@app/shared/components/area-search-fields/area-search-premier-note.component';
import { tabIconClass } from '@app/shared/components/area-search-fields/area-search-field.utils';
import { CommonQueriesPanelComponent } from '@app/shared/components/area-search-panels/common-queries-panel.component';
import { RecentQueriesPanelComponent } from '@app/shared/components/area-search-panels/recent-queries-panel.component';
import { PREMIUM_FIELD_GROUP_IDS, AREA_SEARCH_DEFAULT_MAX_LIMIT } from '@app/core/config/area-search-fields.config';
import { AreaSearchFieldMeta } from '@app/core/interfaces/area-search-field.interface';
import { CommonAreaSearchQuery, RecentAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { AreaSearchDynamicChoicesService } from '@app/core/services/area-search-dynamic-choices.service';
import { AreaSearchFieldsService } from '@app/core/services/area-search-fields.service';
import { AreaSearchFormService } from '@app/core/services/area-search-form.service';
import { AreaSearchService } from '@app/core/services/area-search.service';
import { AreaSearchSessionService } from '@app/core/services/area-search-session.service';
import { AreaSearchStateService } from '@app/core/services/area-search-state.service';
import { CommonQueriesService } from '@app/core/services/common-queries.service';
import { RecentQueriesService } from '@app/core/services/recent-queries.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { extractLeadsMeta, mapPropertyRecords } from '@app/core/utils/property-record.mapper';
import { buildSelectedCriteria } from '@app/core/utils/area-search-criteria.util';
import { PropertyRecordRaw } from '@app/core/interfaces/property-record.interface';
import { AreaSearchFieldGroup } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchControlStyles } from '@app/shared/components/area-search-fields/area-search-control.styles';
import { AreaSearchCriteriaChipsComponent } from '@app/shared/components/area-search-fields/area-search-criteria-chips.component';

@Component({
  selector: 'app-area-search',
  standalone: true,
  imports: [
    JsonPipe,
    FormsModule,
    InputText,
    Checkbox,
    ButtonComponent,
    AlertComponent,
    CardComponent,
    ModalComponent,
    AreaSearchFieldComponent,
    AreaSearchOafAccordionComponent,
    AreaSearchPremierNoteComponent,
    RecentQueriesPanelComponent,
    CommonQueriesPanelComponent,
    AreaSearchCriteriaChipsComponent
  ],
  templateUrl: './area-search.component.html'
})
export class AreaSearchComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly controlStyles = AreaSearchControlStyles;
  @ViewChild('mainContent') private mainContentRef?: ElementRef<HTMLElement>;
  @ViewChild('saveModal') private saveModal?: ModalComponent;
  @ViewChild('shareModal') private shareModal?: ModalComponent;
  @ViewChild('geographyModal') private geographyModal?: ModalComponent;
  @ViewChild('almModal') private almModal?: ModalComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fieldsService = inject(AreaSearchFieldsService);
  private readonly dynamicChoicesService = inject(AreaSearchDynamicChoicesService);
  private readonly formService = inject(AreaSearchFormService);
  private readonly areaSearchService = inject(AreaSearchService);
  private readonly sessionService = inject(AreaSearchSessionService);
  private readonly stateService = inject(AreaSearchStateService);
  private readonly recentQueriesService = inject(RecentQueriesService);
  private readonly commonQueriesService = inject(CommonQueriesService);
  private readonly verticalService = inject(VerticalService);

  private resizeObserver?: ResizeObserver;

  readonly premiumGroupIds = PREMIUM_FIELD_GROUP_IDS;
  readonly fieldsLoading = this.fieldsService.loading;
  readonly fieldsError = this.fieldsService.error;
  readonly formData = this.formService.formData;
  readonly activeTab = this.formService.activeTab;
  readonly basicFieldGroups = this.formService.basicFieldGroups;
  readonly activeFieldGroup = this.formService.activeFieldGroup;
  readonly hasGeometry = this.formService.hasGeometry;
  readonly countResult = this.areaSearchService.countResult;
  readonly sending = this.areaSearchService.sending;
  readonly showQueriesPanel = this.stateService.showQueriesPanel;
  readonly activeQueriesTab = this.stateService.activeQueriesTab;

  readonly actionError = signal<string | null>(null);
  readonly actionNotice = signal<string | null>(null);
  readonly saveName = signal('');
  readonly shareEmail = signal('');
  readonly mobileTabOpen = signal(false);
  readonly fieldsReady = signal(false);
  readonly renderedFieldCount = signal(0);

  readonly pageTitle = computed(() => {
    if (this.hasGeometry()) {
      return 'Available Filters';
    }
    return 'Area Search';
  });

  readonly pageSubtitle = computed(() =>
    this.hasGeometry()
      ? 'Refine your map-based search with additional filters.'
      : 'Search for properties using Advanced Search.'
  );

  readonly hasCountResult = computed(() => !!this.countResult());
  readonly promotedOafFields = this.formService.promotedOafFields;

  readonly commonQueriesSupport = computed(
    () => !!this.verticalService.content()?.app_config?.['common_queries_support']
  );
  readonly automationSupport = computed(
    () => !!this.verticalService.content()?.app_config?.['automation_support']
  );
  readonly supportDirectGlobalSearch = computed(
    () => !!this.verticalService.content()?.app_config?.['support_direct_global_search']
  );

  readonly availableOafFields = computed(() => {
    const group = this.activeFieldGroup();
    const promoted = this.promotedOafFields();
    if (!group?.other_fields?.length) {
      return [];
    }

    return group.other_fields.filter((field) => !promoted.has(field.field_name));
  });

  readonly visibleOafFields = computed(() => {
    const group = this.activeFieldGroup();
    const promoted = this.promotedOafFields();
    if (!group?.other_fields?.length) {
      return [];
    }

    return group.other_fields.filter((field) => promoted.has(field.field_name));
  });

  readonly mobileTabLabel = computed(() => this.activeFieldGroup()?.group_name ?? 'Select tab');

  readonly selectedCriteria = computed(() => {
    const formData = this.formData();
    const choiceCtx = this.fieldChoiceContext();

    return buildSelectedCriteria(
      formData,
      this.formService.fieldsInfo() ?? {},
      this.formService.fieldGroups(),
      (fieldName, value) =>
        this.dynamicChoicesService.resolveLabel(
          fieldName,
          value,
          choiceCtx.dependencyKeys[fieldName] ?? 'static'
        )
    );
  });

  readonly fieldChoiceContext = computed(() => {
    const group = this.activeFieldGroup();
    const rendered = this.renderedFieldCount();
    const formData = this.formService.formData();
    const hasGeometry = this.formService.hasGeometry();
    const dependencyKeys: Record<string, string> = {};
    const choicesDisabled: Record<string, boolean> = {};

    if (!group) {
      return { dependencyKeys, choicesDisabled };
    }

    const oafFields = rendered >= group.fields.length ? (group.other_fields ?? []) : [];
    const fields = [...group.fields, ...oafFields];

    for (const field of fields) {
      dependencyKeys[field.field_name] = this.dynamicChoicesService.buildDependencyKey(field, formData);
      choicesDisabled[field.field_name] = this.dynamicChoicesService.isFieldChoicesDisabled(
        field,
        formData,
        hasGeometry
      );
    }

    return { dependencyKeys, choicesDisabled };
  });

  ngOnInit(): void {
    this.reloadFields();
  }

  reloadFields(force = false): void {
    this.actionError.set(null);
    this.fieldsReady.set(false);
    this.renderedFieldCount.set(0);
    this.fieldsService.loadFields(force).subscribe({
      next: () => {
        this.formService.initForm();
        this.applyEntrySources();
        this.prefetchDependentChoices();
        this.fieldsReady.set(true);
        this.beginIncrementalFieldRender();
      },
      error: (err: Error) => {
        this.actionError.set(err.message ?? 'Failed to load search fields.');
      }
    });
  }

  private beginIncrementalFieldRender(): void {
    const group = this.activeFieldGroup();
    const total = group?.fields?.length ?? 0;
    this.renderedFieldCount.set(0);

    if (!total) {
      return;
    }

    const isHeavyTab =
      !!group && (this.isPremiumTab(group.group_id) || group.group_id === 7 || total > 12);
    const batchSize = isHeavyTab ? 1 : 3;
    const frameGap = isHeavyTab ? 2 : 1;
    let framesUntilNextBatch = 0;

    const renderBatch = (): void => {
      if (framesUntilNextBatch > 0) {
        framesUntilNextBatch -= 1;
        requestAnimationFrame(renderBatch);
        return;
      }

      const next = Math.min(this.renderedFieldCount() + batchSize, total);
      this.renderedFieldCount.set(next);

      if (next < total) {
        framesUntilNextBatch = frameGap;
        requestAnimationFrame(renderBatch);
      }
    };

    requestAnimationFrame(renderBatch);
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver !== 'undefined' && this.mainContentRef?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => this.syncPanelHeight());
      this.resizeObserver.observe(this.mainContentRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.dynamicChoicesService.clearInflight();
    this.dynamicChoicesService.clearLabelCache();
  }

  tabIcon(groupName: string): string {
    return tabIconClass(groupName);
  }

  isPremiumTab(groupId: number): boolean {
    return this.premiumGroupIds.includes(groupId as (typeof PREMIUM_FIELD_GROUP_IDS)[number]);
  }

  changeTab(index: number): void {
    this.renderedFieldCount.set(0);
    this.formService.setActiveTab(index);
    this.mobileTabOpen.set(false);
    requestAnimationFrame(() => this.beginIncrementalFieldRender());
  }

  visibleFields(fields: AreaSearchFieldMeta[]): AreaSearchFieldMeta[] {
    return fields.slice(0, this.renderedFieldCount());
  }

  usesRowLayout(group: AreaSearchFieldGroup): boolean {
    return group.group_id !== 8 && group.layout_row !== false;
  }

  usesFullWidthField(group: AreaSearchFieldGroup): boolean {
    return group.group_id === 8;
  }

  clearFields(): void {
    this.formService.clearAllFields();
    this.areaSearchService.clearCountResult();
    this.actionError.set(null);
    this.actionNotice.set(null);
  }

  resetArrangements(): void {
    this.formService.resetArrangements();
  }

  removeCriteria(fieldName: string): void {
    if (this.formService.isOafPromoted(fieldName)) {
      this.formService.demoteOafField(fieldName);
      return;
    }

    this.formService.clearField(fieldName);
  }

  queriesPanelClass(): string {
    const base =
      'relative border-l border-border bg-surface transition-[width,max-width] duration-200';

    if (!this.showQueriesPanel()) {
      return `${base} w-0 max-w-0 overflow-hidden border-l-0`;
    }

    return `${base} w-[510px] max-w-[40vw] max-md:fixed max-md:inset-0 max-md:z-40 max-md:w-full! max-md:max-w-full!`;
  }

  toggleQueriesPanel(): void {
    const willOpen = !this.showQueriesPanel();
    this.stateService.toggleQueriesPanel();

    if (willOpen && this.commonQueriesSupport() && !this.commonQueriesService.queries().length) {
      this.commonQueriesService.fetchList();
    }
  }

  setQueriesTab(tab: 0 | 1): void {
    this.stateService.setActiveQueriesTab(tab);
  }

  onFieldChange(fieldName: string, patch: Record<string, unknown>): void {
    this.formService.updateFieldValue(fieldName, patch);

    if (fieldName === 'mm_fips_state_code' || fieldName === 'mm_fips_muni_code') {
      this.dynamicChoicesService.invalidateDependents(fieldName);
      queueMicrotask(() => this.prefetchDependentChoices(fieldName));
    }
  }

  private prefetchDependentChoices(changedField?: string): void {
    const formData = this.formService.formData();
    const fieldsInfo = this.formService.fieldsInfo() ?? {};

    if (changedField) {
      this.dynamicChoicesService.prefetchForParentChange(changedField, formData, fieldsInfo);
      return;
    }

    this.dynamicChoicesService.prefetchDependents(formData, fieldsInfo);
  }

  promoteOafField(field: AreaSearchFieldMeta): void {
    this.formService.promoteOafField(field);
  }

  demoteOafField(fieldName: string): void {
    this.formService.demoteOafField(fieldName);
  }

  enableLimitRecords(): void {
    const current = this.formData().max_limit;
    if (!current?.check) {
      this.formService.updateFieldValue('max_limit', { check: true, value: AREA_SEARCH_DEFAULT_MAX_LIMIT });
    }
  }

  getCount(): void {
    this.actionError.set(null);
    const payload = this.formService.buildPayload();

    this.areaSearchService.getCount(payload).subscribe({
      next: (result) => {
        this.recentQueriesService.addOrPromote('Recent Search', payload, result.rec_count ?? result.total_found);
        this.showNotice(`Found ${result.rec_count ?? result.total_found ?? 0} record(s).`);
      },
      error: (err: Error) => {
        this.actionError.set(err.message ?? 'Failed to get record count.');
      }
    });
  }

  viewRecords(): void {
    this.actionError.set(null);
    const payload = this.formService.buildPayload();
    const limit = Number(payload.searchOptions?.max_limit) || AREA_SEARCH_DEFAULT_MAX_LIMIT;

    this.areaSearchService.searchRecords(payload, 1, limit).subscribe({
      next: (data) => {
        const rawRecords = (data.recs ?? []) as PropertyRecordRaw[];
        const leadsMeta = extractLeadsMeta(rawRecords);
        const rows = mapPropertyRecords(rawRecords, leadsMeta.leadsAttr, leadsMeta.leadsTypes);
        const sessionId = this.sessionService.createSession({
          title: this.stateService.queryName() ?? 'Area Search Results',
          criteria: data.query ?? payload,
          criteriaChips: this.selectedCriteria(),
          rows,
          rawRecords,
          countResult: this.countResult() ?? undefined,
          pagingInfo: data.paging_info,
          queryId: this.stateService.queryId() ?? undefined
        });

        void this.router.navigate(['/detail/query', sessionId], {
          queryParams: { returnUrl: '/farming/area-search' }
        });
      },
      error: (err: Error) => {
        this.actionError.set(err.message ?? 'Failed to load search records.');
      }
    });
  }

  closeSaveModal(): void {
    this.saveModal?.close();
  }

  closeShareModal(): void {
    this.shareModal?.close();
  }

  closeGeographyModal(): void {
    this.geographyModal?.close();
  }

  closeAlmModal(): void {
    this.almModal?.close();
  }

  openSaveModal(): void {
    this.saveName.set(this.stateService.queryName() ?? '');
    this.saveModal?.open();
  }

  confirmSave(): void {
    const name = this.saveName().trim();
    if (!name) {
      return;
    }

    const payload = this.formService.buildPayload();
    const queryId = this.stateService.queryId();

    this.areaSearchService
      .saveQuery({
        name,
        query: payload,
        is_to_update: !!queryId,
        query_id: queryId ?? undefined
      })
      .subscribe({
        next: () => {
          this.saveModal?.close();
          this.showNotice('Search saved successfully.');
        },
        error: (err: Error) => this.actionError.set(err.message ?? 'Failed to save search.')
      });
  }

  openShareModal(): void {
    this.shareEmail.set('');
    this.shareModal?.open();
  }

  confirmShare(): void {
    const email = this.shareEmail().trim();
    if (!email) {
      return;
    }

    this.areaSearchService
      .shareQuery({
        shared_to_email: email,
        query: this.formService.buildPayload(),
        name: this.saveName() || 'Shared Search'
      })
      .subscribe({
        next: () => {
          this.shareModal?.close();
          this.showNotice('Search shared successfully.');
        },
        error: (err: Error) => this.actionError.set(err.message ?? 'Failed to share search.')
      });
  }

  payNow(): void {
    this.areaSearchService.purchaseRecs(this.formService.buildPayload()).subscribe({
      next: () => this.showNotice('Purchase request submitted.'),
      error: (err: Error) => this.actionError.set(err.message ?? 'Failed to process purchase.')
    });
  }

  openGeographyModal(): void {
    this.geographyModal?.open();
  }

  openAlmModal(): void {
    this.almModal?.open();
  }

  onRecentSearch(query: RecentAreaSearchQuery): void {
    this.formService.loadFromPayload(query.query);
    this.getCount();
  }

  onRecentRevise(query: RecentAreaSearchQuery): void {
    this.formService.loadFromPayload(query.query);
    this.showNotice('Criteria loaded. Update fields and search again.');
  }

  onCommonSearch(query: CommonAreaSearchQuery): void {
    if (!query.query) {
      return;
    }

    this.formService.loadFromPayload(query.query);
    this.getCount();
  }

  private applyEntrySources(): void {
    const geometry = this.stateService.consumePendingGeometry();
    if (geometry) {
      this.formService.setGeometry({
        match: geometry.match,
        value: geometry.value
      });
    }

    const editCriteria = this.stateService.consumeEditCriteria();
    if (editCriteria) {
      this.formService.loadFromPayload(editCriteria);
    }

    const queryId = this.route.snapshot.queryParamMap.get('queryId');
    if (queryId) {
      this.loadSavedQuery(queryId);
      return;
    }

    if (this.route.snapshot.queryParamMap.get('edit') === 'true' && editCriteria) {
      return;
    }
  }

  private loadSavedQuery(queryId: string): void {
    this.areaSearchService.getSavedQuery(queryId).subscribe({
      next: (record) => {
        const query = record.query;
        if (query) {
          this.formService.loadFromPayload(query);
          this.stateService.setQueryMeta(String(record.query_id ?? queryId), record.name ?? null);
        }
      },
      error: (err: Error) => this.actionError.set(err.message ?? 'Failed to load saved search.')
    });
  }

  private syncPanelHeight(): void {
    const main = this.mainContentRef?.nativeElement;
    if (!main) {
      return;
    }

    const height = `${main.offsetHeight}px`;
    main.closest('.area-search-layout')?.setAttribute('style', `--main-content-height:${height}`);
  }

  private showNotice(message: string): void {
    this.actionNotice.set(message);
    setTimeout(() => {
      if (this.actionNotice() === message) {
        this.actionNotice.set(null);
      }
    }, 4000);
  }
}
