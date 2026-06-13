import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  signal,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';
import { AdminPermissionsService } from '@app/authenticated/admin/services/admin-permissions.service';
import { DashboardTabToolbarService } from '@app/authenticated/dashboard/services/dashboard-tab-toolbar.service';
import { ADMIN_NAV, MANAGE_ACCOUNT_NAV, DASHBOARD_SECTION_NAV, NavItem } from '@app/core/config/navigation.config';
import { CardComponent, TabToolbarComponent } from '@app/shared/components';
import {
  WalletBalanceCardComponent,
  SubscriptionCardComponent,
  AccountSettingsCardComponent,
  AccountInformationPanelComponent,
  DownloadHistoryPanelComponent,
  PurchaseHistoryPanelComponent,
  OrderHistoryPanelComponent
} from '../components';
import {
  AdminUsersPanelComponent,
  AdminOfficesPanelComponent,
  AdminAgenciesPanelComponent
} from '@app/authenticated/admin/components';

export type DashboardSectionId = 'admin' | 'manage-reports' | 'manage-account';

const SECTION_IDS: DashboardSectionId[] = ['admin', 'manage-reports', 'manage-account'];

const SECTION_META: Record<DashboardSectionId, { title: string; subtitle: string }> = {
  admin: { title: 'Admin', subtitle: 'Manage users, agencies, and offices' },
  'manage-reports': { title: 'Manage Reports', subtitle: 'Reports and order history' },
  'manage-account': {
    title: 'Manage Account',
    subtitle: 'Review your profile, downloads, and purchase activity'
  }
};

const DEFAULT_TAB: Record<DashboardSectionId, string> = {
  admin: 'users',
  'manage-reports': 'order-history',
  'manage-account': 'account-information'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    WalletBalanceCardComponent,
    SubscriptionCardComponent,
    AccountSettingsCardComponent,
    CardComponent,
    NgTemplateOutlet,
    TabToolbarComponent,
    AccountInformationPanelComponent,
    DownloadHistoryPanelComponent,
    PurchaseHistoryPanelComponent,
    AdminUsersPanelComponent,
    AdminOfficesPanelComponent,
    AdminAgenciesPanelComponent,
    OrderHistoryPanelComponent
  ],
  templateUrl: './dashboard.component.html',
  styles: [
    `
      .dashboard-tabs-slider {
        transition:
          transform 0.32s cubic-bezier(0.34, 1.15, 0.64, 1),
          width 0.32s cubic-bezier(0.34, 1.15, 0.64, 1),
          opacity 0.2s ease;
        will-change: transform, width;
      }

      .dashboard-tab-panel {
        animation: dashboardTabPanelIn 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes dashboardTabPanelIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .dashboard-tabs-slider,
        .dashboard-tab-panel {
          transition: none !important;
          animation: none !important;
        }
      }
    `
  ]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly adminPermissions = inject(AdminPermissionsService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly tabToolbar = inject(DashboardTabToolbarService);

  @ViewChild('tabNav') tabNav?: ElementRef<HTMLElement>;
  @ViewChildren('tabButton') tabButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly subscriptionExpanded = signal(false);
  readonly name = computed(() => this.authService.getUserName());
  readonly dashboardSections = DASHBOARD_SECTION_NAV;
  readonly activeSection = signal<DashboardSectionId>('manage-account');
  readonly activeTabKey = signal(DEFAULT_TAB['manage-account']);
  readonly tabIndicator = signal({ width: 0, left: 0, ready: false });

  readonly currentTabs = computed(() => this.tabsForSection(this.activeSection()));
  readonly sectionTitle = computed(() => SECTION_META[this.activeSection()].title);
  readonly sectionSubtitle = computed(() => SECTION_META[this.activeSection()].subtitle);
  readonly activeTabLabel = computed(
    () => this.currentTabs().find(tab => this.tabKey(tab) === this.activeTabKey())?.label ?? ''
  );

  private resizeObserver?: ResizeObserver;
  private tabButtonsChangesSub?: { unsubscribe(): void };
  private readonly onWindowResize = (): void => this.updateTabIndicator();

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.scheduleTabIndicatorUpdate();
    window.addEventListener('resize', this.onWindowResize);

    this.tabButtonsChangesSub = this.tabButtons?.changes.subscribe(() => this.updateTabIndicator());

    const navElement = this.tabNav?.nativeElement;
    if (navElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateTabIndicator());
      this.resizeObserver.observe(navElement);
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.removeEventListener('resize', this.onWindowResize);
    this.resizeObserver?.disconnect();
    this.tabButtonsChangesSub?.unsubscribe();
  }

  tabKey(tab: NavItem): string {
    return tab.route?.split('/').pop() ?? tab.label.toLowerCase().replace(/\s+/g, '-');
  }

  sectionId(section: NavItem): DashboardSectionId {
    const index = this.dashboardSections.indexOf(section);
    return SECTION_IDS[index] ?? 'manage-account';
  }

  selectSection(section: NavItem): void {
    const id = this.sectionId(section);
    this.activeSection.set(id);
    this.activeTabKey.set(this.resolveDefaultTab(id));
    this.scheduleTabIndicatorUpdate();
  }

  isSectionActive(section: NavItem): boolean {
    return this.activeSection() === this.sectionId(section);
  }

  selectTab(tab: NavItem): void {
    const key = this.adminPermissions.normalizeAdminTabKey(this.tabKey(tab));
    this.activeTabKey.set(key);
    this.scheduleTabIndicatorUpdate();
  }

  tabSliderStyle(): { transform: string; width: string; opacity: number } {
    const slider = this.tabIndicator();
    return {
      transform: `translateX(${slider.left}px)`,
      width: `${slider.width}px`,
      opacity: slider.ready ? 1 : 0
    };
  }

  isTabActive(tab: NavItem): boolean {
    return this.activeTabKey() === this.tabKey(tab);
  }

  private tabsForSection(section: DashboardSectionId): NavItem[] {
    switch (section) {
      case 'admin':
        return this.adminPermissions.adminTabs();
      case 'manage-reports':
        return ADMIN_NAV[1]?.children ?? [];
      case 'manage-account':
        return MANAGE_ACCOUNT_NAV;
    }
  }

  private resolveDefaultTab(section: DashboardSectionId): string {
    const tabKey = DEFAULT_TAB[section];
    return section === 'admin' ? this.adminPermissions.normalizeAdminTabKey(tabKey) : tabKey;
  }

  private scheduleTabIndicatorUpdate(): void {
    requestAnimationFrame(() => this.updateTabIndicator());
    setTimeout(() => this.updateTabIndicator(), 0);
  }

  private updateTabIndicator(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const navElement = this.tabNav?.nativeElement;
    const buttons = this.tabButtons?.toArray() ?? [];
    const tabs = this.currentTabs();
    const activeIndex = tabs.findIndex(tab => this.isTabActive(tab));
    const activeButton = buttons[activeIndex]?.nativeElement;

    if (!navElement || !activeButton) {
      return;
    }

    this.tabIndicator.set({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
      ready: true
    });
  }
}
