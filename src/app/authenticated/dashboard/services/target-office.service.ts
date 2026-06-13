import { Injectable, inject } from '@angular/core';
import { AdminPermissionsService } from '@app/authenticated/admin/services/admin-permissions.service';
import { AuthService } from '@app/core/services/auth.service';
import { VerticalService } from '@app/core/services/vertical.service';
import {
  ensureDefaultTargetOffice,
  getTargetOfficeId,
  readTargetOfficeInfo,
  resolveCurrentUsername,
  setTargetOfficeInfo,
  TargetOfficeInfo
} from '@app/core/utils/target-office.util';

@Injectable({ providedIn: 'root' })
export class TargetOfficeService {
  private readonly authService = inject(AuthService);
  private readonly adminPermissions = inject(AdminPermissionsService);
  private readonly verticalService = inject(VerticalService);

  ensureDefault(): TargetOfficeInfo | null {
    const tbOffice = this.authService.tbOffice();
    const agencyConfig = this.verticalService.agencyConfig();

    return ensureDefaultTargetOffice({
      isOfficeTabAllowed: this.adminPermissions.isOfficeTabAllowed(),
      isVerticalInAgencyMode: this.adminPermissions.isVerticalInAgencyMode(),
      currentUsername: resolveCurrentUsername(this.authService.tbUser()),
      userOfficeId: tbOffice?.office_id ?? null,
      userOfficeTitle: tbOffice?.corporate_name ?? null,
      agencyOfficeId: agencyConfig?.office_id ?? null,
      agencyOfficeTitle: agencyConfig?.corporate_name ?? null,
      isAgenciesVertical: this.adminPermissions.isAgenciesTabAllowed()
    });
  }

  getTargetOfficeId(): number | string | null {
    return getTargetOfficeId({
      currentUsername: resolveCurrentUsername(this.authService.tbUser()),
      isAgenciesVertical: this.adminPermissions.isAgenciesTabAllowed(),
      requireUserMatch: !this.adminPermissions.isAgenciesTabAllowed()
    });
  }

  readTargetOffice(): TargetOfficeInfo | null {
    return readTargetOfficeInfo({
      currentUsername: resolveCurrentUsername(this.authService.tbUser()),
      isAgenciesVertical: this.adminPermissions.isAgenciesTabAllowed(),
      requireUserMatch: !this.adminPermissions.isAgenciesTabAllowed()
    });
  }

  setTargetOffice(officeId: number | string, officeTitle: string): void {
    setTargetOfficeInfo({
      storedByUser: resolveCurrentUsername(this.authService.tbUser()),
      officeId,
      officeTitle
    });
  }
}
