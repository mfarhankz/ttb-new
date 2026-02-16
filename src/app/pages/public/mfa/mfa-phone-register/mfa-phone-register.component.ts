import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { SKIP_PHONE_REGISTER_IN_DEV } from '../../../../core/config/api.config';
import { InputComponent, ButtonComponent, AlertComponent } from '../../../../shared/components';

@Component({
  selector: 'app-mfa-phone-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, InputComponent, ButtonComponent, AlertComponent],
  templateUrl: './mfa-phone-register.component.html',
  styles: []
})
export class MfaPhoneRegisterComponent implements OnInit {
  @Input() email: string = '';
  @Input() existingPhone?: string;
  @Output() phoneRegistered = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  phoneForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string>('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  ngOnInit(): void {
    if (this.existingPhone) {
      // Remove any formatting and set the phone number
      const cleanPhone = this.existingPhone.replace(/\D/g, '');
      this.phoneForm.patchValue({ phone: cleanPhone });
    }

    // Auto-register phone if skip phone register flag is enabled in dev mode
    if (SKIP_PHONE_REGISTER_IN_DEV) {
      console.log('Skipping phone registration - auto-registering with default phone');
      // Use default phone number: 1234567890
      const defaultPhone = '1234567890';
      this.phoneForm.patchValue({ phone: defaultPhone });
      // Auto-submit after a short delay
      setTimeout(() => {
        this.onSubmit();
      }, 100);
    }
  }

  getPhoneError(): string {
    const control = this.phoneForm.get('phone');
    if (control?.invalid && control?.touched) {
      if (control.errors?.['required']) {
        return 'Phone number is required';
      }
      if (control.errors?.['pattern']) {
        return 'Phone should be exactly 10 digits';
      }
    }
    return '';
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  onSubmit(): void {
    if (this.phoneForm.invalid) {
      Object.keys(this.phoneForm.controls).forEach(key => {
        this.phoneForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const phone = this.phoneForm.value.phone;

    this.authService.registerPhoneMFA({
      phone: phone
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.phoneRegistered.emit(phone);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Failed to send verification code. Please try again.');
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

