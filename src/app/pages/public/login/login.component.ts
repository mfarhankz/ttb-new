import { Component, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SKIP_LOGIN_IN_DEV } from '../../../core/config/api.config';
import { InputComponent, ButtonComponent, AlertComponent } from '../../../shared/components';
import { MfaPhoneRegisterComponent } from '../mfa/mfa-phone-register/mfa-phone-register.component';
import { MfaOtpVerifyComponent } from '../mfa/mfa-otp-verify/mfa-otp-verify.component';

type LoginView = 'login' | 'mfa-phone-register' | 'mfa-otp-verify';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule,
    InputComponent,
    ButtonComponent,
    AlertComponent,
    MfaPhoneRegisterComponent,
    MfaOtpVerifyComponent
  ],
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string>('');
  currentView = signal<LoginView>('login');
  
  // MFA related
  mfaEmail = signal<string>('');
  mfaPhone = signal<string>('');
  loginResponse: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['ttbhelp@benutech.com', [Validators.required, Validators.email]],
      password: ['TTBHelp123', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Auto-login if skip login flag is enabled in dev mode
    if (SKIP_LOGIN_IN_DEV) {
      console.log('Skipping login - auto-logging in with default credentials');
      this.onSubmit();
    }
  }

  getEmailError(): string {
    const control = this.loginForm.get('email');
    if (control?.invalid && control?.touched) {
      if (control.errors?.['required']) {
        return 'Email is required';
      }
      if (control.errors?.['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.loginForm.get('password');
    if (control?.invalid && control?.touched) {
      if (control.errors?.['required']) {
        return 'Password is required';
      }
      if (control.errors?.['minlength']) {
        return 'Password must be at least 6 characters';
      }
    }
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        
        // Debug logging
        console.log('Login Response:', response);
        
        // Check if login was successful (MFA disabled in dev mode)
        if (response.success) {
          // Login successful - navigate to dashboard
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigate([returnUrl]);
          return;
        }
        
        // MFA is required - handle MFA flow
        if (response.requiresMFA) {
          // MFA is required
          console.log('MFA Required - Switching to MFA view');
          this.mfaEmail.set(response.email || email);
          this.mfaPhone.set(response.phone || '');
          this.loginResponse = response.loginResponse;
          
          if (response.mfaEnrolled) {
            // User is enrolled, show OTP verification
            console.log('User enrolled - showing OTP verification');
            this.currentView.set('mfa-otp-verify');
          } else {
            // User needs to register phone
            console.log('User not enrolled - showing phone registration');
            this.currentView.set('mfa-phone-register');
          }
        } else {
          // MFA should always be required - if not, show error
          this.errorMessage.set(response.message || 'MFA is required but not detected. Please contact support.');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Login failed. Please try again.');
      }
    });
  }

  onPhoneRegistered(phone: string): void {
    // Phone registered, now show OTP verification
    this.mfaPhone.set(phone);
    this.currentView.set('mfa-otp-verify');
  }

  onOtpVerified(): void {
    // OTP verified successfully, complete login
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.router.navigate([returnUrl]);
  }

  onMfaCancel(): void {
    // Cancel MFA flow, return to login
    this.currentView.set('login');
    this.mfaEmail.set('');
    this.mfaPhone.set('');
    this.loginResponse = null;
  }
}

