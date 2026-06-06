import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { AccountInformationService } from '../../../../../core/services/account-information.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { VerticalService } from '../../../../../core/services/vertical.service';
import { US_STATE_OPTIONS } from '../../../../../core/config/us-states.config';
import { UserProfileModel } from '../../../../../core/interfaces/user-profile.interface';
import {
  AlertComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent
} from '../../../../../shared/components';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;

  if (!password && !confirm) {
    return null;
  }

  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-account-information-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    AlertComponent
  ],
  templateUrl: './account-information-panel.component.html'
})
export class AccountInformationPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly verticalService = inject(VerticalService);
  private readonly accountInformationService = inject(AccountInformationService);

  @ViewChild('profilePicInput') profilePicInput?: ElementRef<HTMLInputElement>;

  readonly stateOptions = US_STATE_OPTIONS;
  readonly loading = this.accountInformationService.loading;
  readonly loadError = this.accountInformationService.error;
  readonly repSummary = this.accountInformationService.repSummary;
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly removingPicture = signal(false);
  readonly uploadingPicture = signal(false);

  readonly profileStatusType = signal<'success' | 'error' | ''>('');
  readonly profileStatusMessage = signal('');
  readonly passwordStatusType = signal<'success' | 'error' | ''>('');
  readonly passwordStatusMessage = signal('');
  readonly pictureStatusType = signal<'success' | 'error' | ''>('');
  readonly pictureStatusMessage = signal('');

  readonly profileImageUrl = signal<string | null>(null);
  readonly hasProfilePicture = computed(() => !!this.authService.tbUser()?.user_pic);

  readonly grayOutPrimaryFields = this.verticalService.grayoutPrimaryFields;

  readonly companyLabel = computed(() => {
    const custom = this.verticalService.content()?.custom_content?.['user_manage'] as
      | { account_company_placeholder?: string }
      | undefined;
    return custom?.account_company_placeholder ?? 'Company Name';
  });

  readonly profileForm = this.fb.nonNullable.group({
    username: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    companyName: [''],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    address: ['', Validators.required],
    address2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zip: ['', Validators.required]
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(7)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(7)]]
    },
    { validators: passwordMatchValidator }
  );

  constructor() {
    effect(() => {
      if (this.authService.getUserId() != null) {
        this.accountInformationService.fetchAccountInformation();
      }
    });

    effect(() => {
      const profile = this.accountInformationService.profile();
      if (profile && !this.accountInformationService.loading()) {
        this.applyProfile(profile);
      }
    });
  }

  onProfileSubmit(): void {
    if (this.profileForm.pristine) {
      this.setProfileStatus('error', 'No changes made to save.');
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.setProfileStatus('error', 'Please correct the highlighted fields.');
      return;
    }

    if (!this.accountInformationService.profile()) {
      return;
    }

    const savedProfile = this.accountInformationService.profile()!;
    const savedUsername = savedProfile.TbUser.username ?? '';
    const updated = this.buildProfileFromForm(savedProfile);
    this.savingProfile.set(true);
    this.clearProfileStatus();

    this.accountInformationService.updateUserProfile(updated, savedUsername).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.savingProfile.set(false);
        this.setProfileStatus('success', 'Your profile has been updated successfully.');
        setTimeout(() => this.clearProfileStatus(), 2500);
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.setProfileStatus('error', err.message ?? 'Failed to update profile.');
      }
    });
  }

  onProfileReset(): void {
    const profile = this.accountInformationService.profile();
    if (profile) {
      this.patchProfileForm(profile);
    }
    this.clearProfileStatus();
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.setPasswordStatus('error', 'Please correct the highlighted fields.');
      return;
    }

    const { password, confirmPassword } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    this.clearPasswordStatus();

    this.accountInformationService.changePassword(password, confirmPassword).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.savingPassword.set(false);
        this.setPasswordStatus('success', 'Password has been changed successfully.');
        setTimeout(() => this.clearPasswordStatus(), 2500);
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.setPasswordStatus('error', err.message ?? 'Failed to change password.');
      }
    });
  }

  onPasswordReset(): void {
    this.passwordForm.reset();
    this.clearPasswordStatus();
  }

  triggerProfilePicUpload(): void {
    this.profilePicInput?.nativeElement.click();
  }

  onProfilePicSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.setPictureStatus('error', 'Please select a valid image file.');
      return;
    }

    this.uploadingPicture.set(true);
    this.clearPictureStatus();

    this.accountInformationService.uploadProfilePicture(file).subscribe({
      next: () => {
        this.uploadingPicture.set(false);
        this.refreshProfileImage();
        this.setPictureStatus('success', 'Picture uploaded successfully.');
        setTimeout(() => this.clearPictureStatus(), 2500);
      },
      error: (err) => {
        this.uploadingPicture.set(false);
        this.setPictureStatus('error', err.message ?? 'Failed to upload profile picture.');
      }
    });
  }

  removeProfilePicture(): void {
    this.removingPicture.set(true);
    this.clearPictureStatus();

    this.accountInformationService.removeProfilePicture().subscribe({
      next: () => {
        this.removingPicture.set(false);
        this.profileImageUrl.set(null);
        this.setPictureStatus('success', 'Profile picture removed.');
        setTimeout(() => this.clearPictureStatus(), 2500);
      },
      error: (err) => {
        this.removingPicture.set(false);
        this.setPictureStatus('error', err.message ?? 'Failed to remove profile picture.');
      }
    });
  }

  profileFieldError(field: string): string {
    const control = this.profileForm.get(field);
    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['email']) {
      return 'Enter a valid email address.';
    }

    if (control.errors['pattern'] && field === 'phone') {
      return 'Phone should be exactly 10 digits.';
    }

    return 'Invalid value.';
  }

  passwordFieldError(field: 'password' | 'confirmPassword'): string {
    if (this.grayOutPrimaryFields()) {
      return '';
    }

    const control = this.passwordForm.get(field);
    if (!control || control.disabled || !(control.touched || control.dirty) || !control.errors) {
      if (field === 'confirmPassword' && this.passwordForm.errors?.['passwordMismatch']) {
        return 'Confirm password does not match password.';
      }
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['minlength']) {
      return 'Password should be at least 7 characters.';
    }

    return '';
  }

  private applyProfile(profile: UserProfileModel): void {
    this.patchProfileForm(this.accountInformationService.normalizeProfile(profile));
    this.refreshProfileImage();
  }

  private patchProfileForm(profile: UserProfileModel): void {
    const address = profile.TbAddress[0] ?? {};
    const phone = profile.TbPhone[0]?.phone;

    this.profileForm.reset({
      username: profile.TbUser.username ?? '',
      firstName: profile.TbUser.first_name ?? '',
      lastName: profile.TbUser.last_name ?? '',
      companyName: profile.TbUser.company_name ?? '',
      phone: phone != null ? String(phone).replace(/\D/g, '').slice(0, 10) : '',
      address: address.address ?? '',
      address2: address.address_2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      zip: address.zip ?? ''
    });
    this.profileForm.get('username')?.disable({ emitEvent: false });
    this.profileForm.markAsPristine();
  }

  private buildProfileFromForm(base: UserProfileModel): UserProfileModel {
    const form = this.profileForm.getRawValue();
    const profile = this.accountInformationService.normalizeProfile(base);

    profile.TbUser.username = form.username.trim();
    profile.TbUser.first_name = form.firstName.trim();
    profile.TbUser.last_name = form.lastName.trim();
    profile.TbUser.company_name = form.companyName.trim();

    profile.TbAddress[0].address = form.address.trim();
    profile.TbAddress[0].address_2 = form.address2.trim();
    profile.TbAddress[0].city = form.city.trim();
    profile.TbAddress[0].state = form.state;
    profile.TbAddress[0].zip = form.zip.trim();

    profile.TbPhone[0].phone = form.phone;
    profile.TbEmail[0].email = form.username.trim();

    return profile;
  }

  private refreshProfileImage(): void {
    this.profileImageUrl.set(this.authService.getUserPictureUrl());
  }

  private setProfileStatus(type: 'success' | 'error', message: string): void {
    this.profileStatusType.set(type);
    this.profileStatusMessage.set(message);
  }

  private clearProfileStatus(): void {
    this.profileStatusType.set('');
    this.profileStatusMessage.set('');
  }

  private setPasswordStatus(type: 'success' | 'error', message: string): void {
    this.passwordStatusType.set(type);
    this.passwordStatusMessage.set(message);
  }

  private clearPasswordStatus(): void {
    this.passwordStatusType.set('');
    this.passwordStatusMessage.set('');
  }

  private setPictureStatus(type: 'success' | 'error', message: string): void {
    this.pictureStatusType.set(type);
    this.pictureStatusMessage.set(message);
  }

  private clearPictureStatus(): void {
    this.pictureStatusType.set('');
    this.pictureStatusMessage.set('');
  }
}
