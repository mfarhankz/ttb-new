import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminPermissionsService } from '@app/features/admin/services/admin-permissions.service';

/** Legacy: offices route redirects to agencies when agency_support is enabled. */
export const adminOfficesGuard: CanActivateFn = () => {
  const adminPermissions = inject(AdminPermissionsService);
  const router = inject(Router);

  if (adminPermissions.isAgenciesTabAllowed()) {
    return router.createUrlTree(['/admin/agencies']);
  }

  if (!adminPermissions.isOfficeTabAllowed()) {
    return router.createUrlTree(['/admin/users']);
  }

  return true;
};

export const adminAgenciesGuard: CanActivateFn = () => {
  const adminPermissions = inject(AdminPermissionsService);
  const router = inject(Router);

  if (!adminPermissions.isAgenciesTabAllowed()) {
    return router.createUrlTree([
      adminPermissions.isOfficeTabAllowed() ? '/admin/offices' : '/admin/users'
    ]);
  }

  return true;
};
