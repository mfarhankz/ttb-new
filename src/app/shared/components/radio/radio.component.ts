import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true
    }
  ],
  templateUrl: './radio.component.html',
  styles: []
})
export class RadioComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() name = '';
  @Input() value: any = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() wrapperClass = '';

  selectedValue: any = null;
  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  get isChecked(): boolean {
    return this.selectedValue === this.value;
  }

  getRadioClasses(): string {
    const baseClasses = 'border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors';
    
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    const errorClass = this.error ? 'border-red-500' : '';
    const disabledClass = this.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return `${baseClasses} ${sizeClasses[this.size]} ${errorClass} ${disabledClass}`;
  }

  getLabelClasses(): string {
    const baseClasses = 'text-sm';
    const disabledClass = this.disabled ? 'text-gray-400' : 'text-gray-700';
    return `${baseClasses} ${disabledClass}`;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedValue = this.value;
      this.onChangeFn(this.selectedValue);
    }
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

