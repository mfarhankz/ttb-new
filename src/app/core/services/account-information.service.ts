import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  RepProfileSummary,
  TtbChangePasswordResponse,
  TtbEditUserResponse,
  TtbLoadUserProfileResponse,
  TtbProfilePicResponse,
  UserProfileModel
} from '../interfaces/user-profile.interface';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AccountInformationService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  private readonly _profile = signal<UserProfileModel | null>(null);
  private readonly _repSummary = signal<RepProfileSummary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private loadedUserId: number | string | null = null;
  private loadSucceeded = false;

  readonly profile = this._profile.asReadonly();
  readonly repSummary = this._repSummary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  fetchAccountInformation(force = false): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this._error.set('Unable to determine current user.');
      return;
    }

    if (!force && this.loadSucceeded && this.loadedUserId === userId) {
      return;
    }

    this.loadedUserId = userId;
    this._loading.set(true);
    this._error.set(null);

    this.loadUserProfile(userId).subscribe({
      next: (profile) => {
        this._profile.set(profile);
        const repId = profile.TbAssociation?.parent_user_id;
        if (repId == null || repId === '' || repId === '0' || repId === 0) {
          this._repSummary.set(null);
          this.loadSucceeded = true;
          this._loading.set(false);
          return;
        }

        this.loadRepSummary(repId).subscribe({
          next: (summary) => {
            this._repSummary.set(summary);
            this.loadSucceeded = true;
            this._loading.set(false);
          },
          error: () => {
            this._repSummary.set(null);
            this.loadSucceeded = true;
            this._loading.set(false);
          }
        });
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load account information.');
        this._loading.set(false);
      }
    });
  }

  clearCache(): void {
    this.loadedUserId = null;
    this.loadSucceeded = false;
    this._profile.set(null);
    this._repSummary.set(null);
    this._error.set(null);
    this._loading.set(false);
  }

  loadUserProfile(userId: number | string): Observable<UserProfileModel> {
    return this.apiService
      .post<TtbLoadUserProfileResponse>(API_CONFIG.endpoints.loadEditUser, {
        TbUser: { users_id: userId }
      })
      .pipe(
        map((response) => {
          const payload = response.response;
          if (payload.status !== 'OK' || !payload.data?.object) {
            const message = Array.isArray(payload.data)
              ? payload.data.join(', ')
              : payload.data?.msg ?? payload.message ?? 'Failed to load profile.';
            throw new Error(message);
          }

          return this.normalizeProfile(payload.data.object);
        })
      );
  }

  loadRepSummary(repId: number | string): Observable<RepProfileSummary | null> {
    if (repId == null || repId === '' || repId === '0' || repId === 0) {
      return of(null);
    }

    return this.loadUserProfile(repId).pipe(
      map((profile) => {
        const first = profile.TbUser.first_name ?? '';
        const last = profile.TbUser.last_name ?? '';
        return {
          fullName: `${first} ${last}`.trim() || 'Assigned Rep',
          phone: profile.TbPhone[0]?.phone ?? undefined,
          email: profile.TbEmail[0]?.email ?? profile.TbUser.username ?? undefined
        };
      })
    );
  }

  updateUserProfile(profile: UserProfileModel, originalUsername?: string): Observable<UserProfileModel> {
    const payload = this.buildEditPayload(profile, originalUsername);

    return this.apiService.post<TtbEditUserResponse>(API_CONFIG.endpoints.editUser, payload).pipe(
      map((response) => {
        const payloadResponse = response.response;
        if (payloadResponse.status !== 'OK') {
          const message = Array.isArray(payloadResponse.data)
            ? String(payloadResponse.data[0] ?? 'Failed to update profile.')
            : payloadResponse.message ?? 'Failed to update profile.';
          throw new Error(message);
        }

        const updated = this.normalizeProfile(profile);
        this.authService.updateCachedUserProfile(updated as unknown as Record<string, unknown>);
        this._profile.set(updated);
        return updated;
      })
    );
  }

  changePassword(password: string, confirmPassword: string): Observable<void> {
    return this.apiService
      .post<TtbChangePasswordResponse>(API_CONFIG.endpoints.changePassword, {
        TbUser: {
          password,
          confirm_password: confirmPassword
        }
      })
      .pipe(
        map((response) => {
          if (response.response.status !== 'OK') {
            throw new Error(response.response.data?.[0] ?? 'Failed to change password.');
          }
        })
      );
  }

  removeProfilePicture(): Observable<string> {
    return this.apiService.get<TtbProfilePicResponse>(API_CONFIG.endpoints.removeUserPic).pipe(
      map((response) => {
        if (response.response.status !== 'OK') {
          const message =
            typeof response.response.data === 'string'
              ? response.response.data
              : 'Failed to remove profile picture.';
          throw new Error(message);
        }

        this.authService.updateUserPicture(null);
        return typeof response.response.data === 'string'
          ? response.response.data
          : 'Profile picture removed.';
      })
    );
  }

  uploadProfilePicture(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('data[TbUser][user_pic]', file, file.name);

    return this.apiService.postFormData<TtbProfilePicResponse>(API_CONFIG.endpoints.uploadUserPic, formData).pipe(
      map((response) => {
        if (response.response.status !== 'OK') {
          const data = response.response.data;
          const message = Array.isArray(data)
            ? data[0]
            : typeof data === 'object' && data && 'msg' in data
              ? String(data.msg)
              : 'Failed to upload profile picture.';
          throw new Error(message);
        }

        const userPic =
          typeof response.response.data === 'object' && response.response.data?.user_pic
            ? response.response.data.user_pic
            : typeof response.response.data === 'string'
              ? response.response.data
              : file.name;

        this.authService.updateUserPicture(userPic);
        return userPic;
      })
    );
  }

  createEmptyProfile(): UserProfileModel {
    return this.normalizeProfile({
      TbUser: {},
      TbAddress: [{}],
      TbPhone: [{}],
      TbEmail: [{}],
      TbAssociation: {}
    });
  }

  normalizeProfile(profile: UserProfileModel): UserProfileModel {
    const normalized: UserProfileModel = {
      TbUser: { ...(profile.TbUser ?? {}) },
      TbAddress: [...(profile.TbAddress ?? [])],
      TbPhone: [...(profile.TbPhone ?? [])],
      TbEmail: [...(profile.TbEmail ?? [])],
      TbAssociation: profile.TbAssociation ? { ...profile.TbAssociation } : undefined,
      TbLicense: profile.TbLicense ? { ...profile.TbLicense } : undefined,
      TbOffice: profile.TbOffice ? { ...profile.TbOffice } : undefined
    };

    normalized.TbAddress[0] = normalized.TbAddress[0] ?? {};
    normalized.TbEmail[0] = normalized.TbEmail[0] ?? {};
    normalized.TbPhone[0] = normalized.TbPhone[0] ?? {};

    const phoneValue = normalized.TbPhone[0].phone;
    normalized.TbPhone[0].phone =
      phoneValue == null || phoneValue === '' ? null : Number(String(phoneValue).replace(/\D/g, '')) || phoneValue;

    return normalized;
  }

  private buildEditPayload(profile: UserProfileModel, originalUsername?: string): Record<string, unknown> {
    const user = profile.TbUser ?? {};
    const address = profile.TbAddress?.[0] ?? {};
    const email = profile.TbEmail?.[0] ?? {};
    const phone = profile.TbPhone ?? [];
    const license = profile.TbLicense ?? {};

    const tbUser: Record<string, unknown> = {
      users_id: user.users_id,
      username: user.username,
      type: user.type,
      status: user.status,
      company_name: user.company_name,
      first_name: user.first_name,
      last_name: user.last_name
    };

    if (originalUsername && user.username === originalUsername) {
      delete tbUser['username'];
    }

    return {
      TbUser: tbUser,
      TbAddress: [
        {
          address_id: address.address_id,
          type: address.type,
          address: address.address,
          address_2: address.address_2,
          city: address.city,
          state: address.state,
          zip: address.zip
        }
      ],
      TbEmail: [
        {
          email_id: email.email_id,
          type: email.type,
          email: user.username
        }
      ],
      TbPhone: phone,
      TbLicense: {
        license_number: license.license_number,
        expiration_date: license.expiration_date
      }
    };
  }
}
