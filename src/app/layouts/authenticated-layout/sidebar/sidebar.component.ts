import { Component, computed, inject, OnDestroy, OnInit, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';
import { PropertySearchModalService } from '@app/core/services/property-search-modal.service';
import { ThemeModalService } from '@app/core/services/theme-modal.service';
import { LayoutService } from '@app/core/services/layout.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { ClearSearchService } from '@app/core/services/clear-search.service';
import { ClearSearchStateService } from '@app/core/services/clear-search-state.service';
import {
  MAIN_NAV,
  SETTINGS_NAV,
  SIDEBAR_COLLAPSED_KEY,
  type NavItem
} from '@app/core/config/navigation.config';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  host: {
    class: 'block'
  },
  styles: []
})
export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private propertySearchModalService = inject(PropertySearchModalService);
  private themeModalService = inject(ThemeModalService);
  private layoutService = inject(LayoutService);
  private verticalService = inject(VerticalService);
  private router = inject(Router);
  readonly clearSearchState = inject(ClearSearchStateService);
  private clearSearchService = inject(ClearSearchService);
  private routerSub?: Subscription;
  private flyoutHideTimer?: ReturnType<typeof setTimeout>;

  readonly vertical = this.verticalService;
  readonly sidebarLogoPath = computed(() => this.vertical.dashboardLogoUrl());
  readonly sidebarShortLogoPath = computed(() => this.vertical.dashboardShortLogoUrl());
  collapsedChange = output<boolean>();

  readonly mainNav = computed((): NavItem[] =>
    MAIN_NAV.flatMap((item) => {
      if (item.label === 'Statistics') {
        const statisticsHidden =
          this.verticalService.content()?.custom_content?.user_home?.statistics_hide === true;
        if (statisticsHidden) {
          return [];
        }
        return [item];
      }

      if (item.label !== 'Farming' || !item.children?.length) {
        return [item];
      }

      const netsheetSupported = this.verticalService.content()?.app_config?.['netsheet_support'] !== false;
      const children = item.children.filter(
        (child) => child.route !== '/farming/saved-net-sheets' || netsheetSupported
      );

      return [{ ...item, children }];
    })
  );
  settingsNav = SETTINGS_NAV;

  readonly statisticsHidden = computed(
    () => this.verticalService.content()?.custom_content?.user_home?.statistics_hide === true
  );

  tbUser = this.authService.tbUser;
  name = computed(() => this.authService.getUserName() || 'User');
  userPicture = computed(() => this.authService.getUserPictureUrl());
  userSubtitle = computed(() => {
    const user = this.tbUser();
    return user?.office_name || user?.username || '';
  });
  isCollapsed = false;
  expandedMenu: string | null = null;
  hoveredFlyout = signal<string | null>(null);

  private layoutCollapseSub?: Subscription;

  ngOnInit(): void {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'true') {
      this.setCollapsed(true, false);
    } else {
      this.applySidebarWidth();
    }
    this.layoutCollapseSub = this.layoutService.onSidebarCollapseRequest.subscribe((collapsed) => {
      if (this.isCollapsed !== collapsed) {
        this.setCollapsed(collapsed);
      }
    });
    this.syncExpandedMenusFromRoute();
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.syncExpandedMenusFromRoute();
        this.clearFlyout();
      });
  }

  ngOnDestroy(): void {
    this.layoutCollapseSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    if (this.flyoutHideTimer) clearTimeout(this.flyoutHideTimer);
  }

  hasChildren(item: NavItem): boolean {
    return !!item.children?.length;
  }

  isMenuExpanded(label: string): boolean {
    return this.expandedMenu === label;
  }

  isFlyoutOpen(label: string): boolean {
    return this.isCollapsed && this.hoveredFlyout() === label;
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children?.length) return false;
    const url = this.router.url;
    return item.children.some((child) => child.route && url.startsWith(child.route));
  }

  toggleMenu(item: NavItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isCollapsed) return;
    this.expandedMenu = this.expandedMenu === item.label ? null : item.label;
  }

  onParentMouseEnter(item: NavItem): void {
    if (this.isCollapsed && this.hasChildren(item)) {
      this.showFlyout(item.label);
    }
  }

  onParentMouseLeave(item: NavItem): void {
    if (this.isCollapsed && this.hasChildren(item)) {
      this.hideFlyout(item.label);
    }
  }

  showFlyout(label: string): void {
    if (!this.isCollapsed) return;
    if (this.flyoutHideTimer) {
      clearTimeout(this.flyoutHideTimer);
      this.flyoutHideTimer = undefined;
    }
    this.hoveredFlyout.set(label);
  }

  hideFlyout(label: string): void {
    if (this.hoveredFlyout() !== label) return;
    this.flyoutHideTimer = setTimeout(() => {
      if (this.hoveredFlyout() === label) {
        this.hoveredFlyout.set(null);
      }
    }, 200);
  }

  clearFlyout(): void {
    if (this.flyoutHideTimer) {
      clearTimeout(this.flyoutHideTimer);
      this.flyoutHideTimer = undefined;
    }
    this.hoveredFlyout.set(null);
  }

  private syncExpandedMenusFromRoute(): void {
    this.expandedMenu = null;
    for (const item of this.mainNav()) {
      if (this.isParentActive(item)) {
        this.expandedMenu = item.label;
        break;
      }
    }
  }

  toggleCollapsed(): void {
    this.clearFlyout();
    this.setCollapsed(!this.isCollapsed);
  }

  onNavAction(item: NavItem): void {
    if (item.action === 'logout') {
      this.authService.logout();
      return;
    }

    if (item.action === 'property-search') {
      this.propertySearchModalService.open();
      return;
    }

    if (item.action === 'theme') {
      this.themeModalService.open();
      return;
    }

  }

  onChildNavAction(child: NavItem): void {
    if (child.action) {
      this.onNavAction(child);
    }
  }

  shouldShowClearSearchAfter(item: NavItem): boolean {
    if (!this.clearSearchState.showClearSearch()) {
      return false;
    }

    if (item.label === 'Statistics') {
      return true;
    }

    return item.label === 'Farming' && this.statisticsHidden();
  }

  onClearSearch(): void {
    this.clearSearchService.clearSearch();
  }

  private setCollapsed(collapsed: boolean, persist = true): void {
    this.isCollapsed = collapsed;
    if (persist) {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    }
    this.applySidebarWidth();
    this.layoutService.setSidebarCollapsed(collapsed);
    this.collapsedChange.emit(collapsed);
  }

  private applySidebarWidth(): void {
    const width = this.isCollapsed ? '72px' : '260px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }
}
