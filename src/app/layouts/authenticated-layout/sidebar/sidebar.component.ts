import { Component, computed, inject, OnDestroy, OnInit, output } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import {
  MAIN_NAV,
  SETTINGS_NAV,
  SIDEBAR_COLLAPSED_KEY,
  type NavItem
} from '../../../core/config/navigation.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  host: {
    '[class.collapsed]': 'isCollapsed'
  },
  styles: [`
    :host {
      display: block;
    }
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: var(--sidebar-width, 260px);
      background: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      z-index: 40;
      transition: width 0.2s ease;
      overflow: visible;
    }
    :host(.collapsed) .sidebar {
      width: var(--sidebar-width-collapsed, 72px);
    }
    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--sidebar-border);
      min-height: 5rem;
    }
    :host(.collapsed) .sidebar-user {
      justify-content: center;
      padding: 1rem 0.5rem;
    }
    .sidebar-user-info {
      min-width: 0;
      overflow: hidden;
    }
    :host(.collapsed) .sidebar-user-info {
      display: none;
    }
    .sidebar-user-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--sidebar-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-user-role {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--sidebar-text-muted);
      margin-top: 0.125rem;
    }
    .sidebar-section-label {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--sidebar-text-muted);
      padding: 1rem 1rem 0.5rem;
    }
    :host(.collapsed) .sidebar-section-label {
      display: none;
    }
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0 0.75rem;
    }
    .sidebar-item-wrap {
      position: relative;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      margin-bottom: 0.25rem;
      border-radius: 0.5rem;
      color: var(--sidebar-text);
      text-decoration: none;
      font-size: 0.875rem;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }
    :host(.collapsed) .sidebar-item {
      justify-content: center;
      padding: 0.625rem;
    }
    .sidebar-item:hover {
      background: var(--sidebar-hover-bg);
    }
    .sidebar-item.active {
      background: var(--sidebar-active-bg);
      font-weight: 500;
    }
    .sidebar-item i {
      font-size: 1.125rem;
      flex-shrink: 0;
    }
    .sidebar-item-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host(.collapsed) .sidebar-item-label {
      display: none;
    }
    .sidebar-tooltip {
      display: none;
      position: absolute;
      left: calc(100% + 8px);
      top: 50%;
      transform: translateY(-50%);
      background: var(--sidebar-tooltip-bg);
      color: var(--sidebar-tooltip-text);
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      white-space: nowrap;
      z-index: 50;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    :host(.collapsed) .sidebar-item-wrap:hover .sidebar-tooltip {
      display: block;
    }
    .sidebar-toggle {
      position: absolute;
      top: 1.5rem;
      right: -12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--sidebar-bg);
      border: 1px solid var(--sidebar-border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 41;
      color: var(--sidebar-text-muted);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: color 0.15s ease, transform 0.2s ease;
    }
    .sidebar-toggle:hover {
      color: var(--sidebar-text);
    }
    :host(.collapsed) .sidebar-toggle i {
      transform: rotate(180deg);
    }
    .sidebar-brand-collapsed {
      display: none;
    }
    :host(.collapsed) .sidebar-brand-collapsed {
      display: block;
      text-align: center;
      font-weight: 700;
      font-size: 0.75rem;
      color: var(--sidebar-text);
      padding: 0.5rem 0;
      letter-spacing: -0.02em;
    }
    .sidebar-item-chevron {
      margin-left: auto;
      font-size: 0.75rem;
      transition: transform 0.2s ease;
    }
    .sidebar-item-chevron.expanded {
      transform: rotate(90deg);
    }
    :host(.collapsed) .sidebar-item-chevron {
      display: none;
    }
    .sidebar-children {
      margin-left: 0.75rem;
      padding-left: 0.75rem;
      border-left: 1px solid var(--sidebar-border);
      margin-bottom: 0.25rem;
    }
    :host(.collapsed) .sidebar-children {
      display: none;
    }
    .sidebar-child-item {
      padding-left: 0.5rem;
      font-size: 0.8125rem;
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private routerSub?: Subscription;

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

  isCollapsed = false;
  expandedMenus = new Set<string>();

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
      .subscribe(() => this.syncExpandedMenusFromRoute());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  hasChildren(item: NavItem): boolean {
    return !!item.children?.length;
  }

  isMenuExpanded(label: string): boolean {
    return this.expandedMenus.has(label);
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children?.length) return false;
    const url = this.router.url;
    return item.children.some((child) => child.route && url.startsWith(child.route));
  }

  toggleMenu(item: NavItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.expandedMenus.has(item.label)) {
      this.expandedMenus.delete(item.label);
    } else {
      this.expandedMenus.add(item.label);
    }
  }

  private syncExpandedMenusFromRoute(): void {
    for (const item of this.mainNav) {
      if (this.isParentActive(item)) {
        this.expandedMenus.add(item.label);
      }
    }
  }

  toggleCollapsed(): void {
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
