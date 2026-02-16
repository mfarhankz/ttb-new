import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { InputComponent, ButtonComponent, AlertComponent, CheckboxComponent } from '../../../../shared/components';

@Component({
  selector: 'app-mfa-otp-verify',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, InputComponent, ButtonComponent, AlertComponent, CheckboxComponent],
  templateUrl: './mfa-otp-verify.component.html',
  styles: []
})
export class MfaOtpVerifyComponent {
  @Input() phone: string = '';
  @Input() email: string = '';
  @Output() otpVerified = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  otpForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  resendCooldown = signal<number>(0);
  resendDisabled = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      rememberMe: [false]
    });
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  getOtpError(): string {
    const control = this.otpForm.get('otp');
    if (control?.invalid && control?.touched) {
      if (control.errors?.['required']) {
        return 'Verification code is required';
      }
      if (control.errors?.['pattern']) {
        return 'Verification code must be 6 digits';
      }
    }
    return '';
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      Object.keys(this.otpForm.controls).forEach(key => {
        this.otpForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { otp, rememberMe } = this.otpForm.value;

    this.authService.verifyOTP({
      otp: otp,
      remember_me: rememberMe
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.otpVerified.emit();
        } else {
          this.errorMessage.set(response.message || 'Verification failed. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Invalid verification code. Please try again.');
      }
    });
  }

  requestNewOtp(): void {
    if (this.resendDisabled() || this.resendCooldown() > 0) {
      return;
    }

    this.resendDisabled.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.registerPhoneMFA({
      phone: this.phone.replace(/\D/g, '')
    }).subscribe({
      next: (response) => {
        this.successMessage.set(`New verification code has been sent to ${this.formatPhone(this.phone)}`);
        this.startResendCooldown();
      },
      error: (error) => {
        this.resendDisabled.set(false);
        this.errorMessage.set(error.message || 'Failed to send verification code. Please try again.');
      }
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    this.resendDisabled.set(true);

    const interval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        this.resendDisabled.set(false);
        clearInterval(interval);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

