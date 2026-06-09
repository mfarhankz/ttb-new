import { Component, Input, forwardRef, ChangeDetectorRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  templateUrl: './input.component.html',
  styles: []
})
export class InputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() id = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' = 'text';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() set disabled(value: boolean | string) {
    this.inputDisabled = value === '' || value === true || value === 'true';
    this.cdr.detectChanges();
  }
  @Input() readonly = false;
  @Input() required = false;
  @Input() icon?: string;
  @Input() suffixIcon?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth = true;
  @Input() wrapperClass = '';

  value = '';
  passwordVisible = false;
  private inputDisabled = false;
  private cvaDisabled = false;
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get isDisabled(): boolean {
    return this.inputDisabled || this.cvaDisabled;
  }

  get showPasswordToggle(): boolean {
    return this.type === 'password';
  }

  get inputType(): string {
    return this.showPasswordToggle && this.passwordVisible ? 'text' : this.type;
  }

  get labelClass(): string {
    return 'block text-body-sm font-medium text-foreground mb-1';
  }

  getInputClasses(): string {
    const baseClasses = 'block w-full rounded-md border shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-0';

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base'
    };

    const hasTrailingControl = this.suffixIcon || this.showPasswordToggle;
    const paddingClass = `${this.icon ? 'pl-10' : ''} ${hasTrailingControl ? 'pr-10' : ''}`.trim();
    const errorClass = this.error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-focus focus:border-primary';
    const disabledClass = this.isDisabled
      ? 'bg-background text-muted cursor-not-allowed opacity-80'
      : 'bg-surface';
    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClasses} ${sizeClasses[this.size]} ${paddingClass} ${errorClass} ${disabledClass} ${widthClass}`;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onFocus(): void {
    // Can be extended for focus handling
  }

  togglePasswordVisibility(): void {
    if (!this.showPasswordToggle || this.isDisabled) {
      return;
    }

    this.passwordVisible = !this.passwordVisible;
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled = isDisabled;
    this.cdr.detectChanges();
  }
}

