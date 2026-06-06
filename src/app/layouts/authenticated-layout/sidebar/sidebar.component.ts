import { Component, computed, inject, OnDestroy, OnInit, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { VerticalService } from '../../../core/services/vertical.service';
import {
  MAIN_NAV,
  SETTINGS_NAV,
  SIDEBAR_COLLAPSED_KEY,
  type NavItem
} from '../../../core/config/navigation.config';
import { VERTICAL_CONFIG } from '../../../core/config/vertical.config';

/** Static logos from public/ until vertical white-label URLs are enabled. */
const SIDEBAR_LOGO_PATH = VERTICAL_CONFIG.defaultLogoPath;
const SIDEBAR_SHORT_LOGO_PATH = VERTICAL_CONFIG.defaultShortLogoPath;

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
  private layoutService = inject(LayoutService);
  private verticalService = inject(VerticalService);
  private router = inject(Router);
  private routerSub?: Subscription;
  private flyoutHideTimer?: ReturnType<typeof setTimeout>;

  readonly vertical = this.verticalService;
  readonly sidebarLogoPath = SIDEBAR_LOGO_PATH;
  readonly sidebarShortLogoPath = SIDEBAR_SHORT_LOGO_PATH;
  collapsedChange = output<boolean>();

  mainNav = MAIN_NAV;
  settingsNav = SETTINGS_NAV;

  tbUser = this.authService.tbUser;
  name = computed(() => this.authService.getUserName() || 'User');
  userPicture = computed(() => this.authService.getUserPictureUrl());
  userSubtitle = computed(() => {
    const user = this.tbUser();
    return user?.office_name || user?.username || '';
  });
  showNeedHelp = computed(
    () => !this.verticalService.content()?.custom_content?.user_home?.need_help_hide
  );
  supportPhone = computed(() => {
    const support = this.verticalService.content()?.support_info;
    const userType = Number(this.tbUser()?.type ?? 0);
    if (userType > 1) {
      return (
        support?.technical_support ||
        support?.help_desk_phone ||
        VERTICAL_CONFIG.defaultSupportPhone
      );
    }
    return (
      support?.help_desk_phone ||
      support?.technical_support ||
      VERTICAL_CONFIG.defaultSupportPhone
    );
  });
  supportPhoneTel = computed(() => this.supportPhone().replace(/[^\d+]/g, ''));

  isCollapsed = false;
  expandedMenu: string | null = null;
  hoveredFlyout = signal<string | null>(null);

  ngOnInit(): void {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === 'true') {
      this.setCollapsed(true, false);
    } else {
      this.applySidebarWidth();
    }
    this.syncExpandedMenusFromRoute();
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.syncExpandedMenusFromRoute();
        this.clearFlyout();
      });
  }

  ngOnDestroy(): void {
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
    for (const item of this.mainNav) {
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
    }
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
