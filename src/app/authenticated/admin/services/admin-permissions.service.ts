import { Injectable, computed, inject } from '@angular/core';
import { NavItem } from '@app/core/config/navigation.config';
import { AuthService } from '@app/core/services/auth.service';
import { VerticalService } from '@app/core/services/vertical.service';

/**
 * Legacy manage.admin tab visibility (permissionsFactory + manage.admin.view.html).
 * Users is always shown for admins; Agencies OR Offices is shown based on vertical config.
 */
@Injectable({ providedIn: 'root' })
export class AdminPermissionsService {
  private readonly authService = inject(AuthService);
  private readonly verticalService = inject(VerticalService);

  readonly agencySupport = computed(() => !!this.verticalService.content()?.app_config?.agency_support);

  readonly multiOfficeSupport = computed(() => {
    const multiOffice = this.verticalService.content()?.app_config?.['multi_office_support'];
    return !!multiOffice || this.agencySupport();
  });

  readonly isVerticalInAgencyMode = computed(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.location.pathname !== '/';
  });

  readonly isAgenciesTabAllowed = computed(
    () => this.agencySupport() && this.isOfficeAgencyTabAllowedUserType()
  );

  /** Legacy permissionsFactory.isOfficesVertical — vertical supports office/agency management. */
  readonly isOfficesVertical = computed(() => this.multiOfficeSupport());

  readonly isOfficeTabAllowed = computed(
    () => this.isOfficesVertical() && this.isOfficeAgencyTabAllowedUserType() && !this.isAgenciesTabAllowed()
  );

  officeAssociationAllowed(): boolean {
    return this.isOfficesVertical() && this.isOfficeAgencyTabAllowedUserType();
  }

  readonly adminTabs = computed((): NavItem[] => {
    const tabs: NavItem[] = [
      { label: 'Users', icon: 'pi pi-users', route: '/admin/users' }
    ];

    if (this.isAgenciesTabAllowed()) {
      tabs.push({ label: 'Agencies', icon: 'pi pi-sitemap', route: '/admin/agencies' });
    } else if (this.isOfficeTabAllowed()) {
      tabs.push({ label: 'Offices', icon: 'pi pi-building', route: '/admin/offices' });
    }

    return tabs;
  });

  normalizeAdminTabKey(tabKey: string): string {
    if (tabKey === 'offices' && this.isAgenciesTabAllowed()) {
      return 'agencies';
    }

    if (tabKey === 'agencies' && !this.isAgenciesTabAllowed()) {
      return this.isOfficeTabAllowed() ? 'offices' : 'users';
    }

    if ((tabKey === 'offices' || tabKey === 'agencies') && !this.isOfficeTabAllowed() && !this.isAgenciesTabAllowed()) {
      return 'users';
    }

    return tabKey;
  }

  /** Legacy permissionsFactory.isOfficeAgencyTabAllowedUserType — CS/CM and higher. */
  private isOfficeAgencyTabAllowedUserType(userType?: number): boolean {
    const type = userType ?? Number(this.authService.tbUser()?.type ?? 0);
    return type === 4 || type >= 6;
  }
}
