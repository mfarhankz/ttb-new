import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true
    }
  ],
  templateUrl: './toggle.component.html',
  styles: []
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() wrapperClass = '';

  checked = false;
  private onChangeFn = (value: boolean) => {};
  private onTouchedFn = () => {};

  getTrackClasses(): string {
    const base =
      'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2';

    if (this.disabled) {
      return `${base} cursor-not-allowed bg-border/80`;
    }

    return this.checked
      ? `${base} cursor-pointer bg-success`
      : `${base} cursor-pointer bg-muted/40`;
  }

  getThumbClasses(): string {
    const base =
      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out';

    return this.checked ? `${base} translate-x-6` : `${base} translate-x-1`;
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }

    this.checked = !this.checked;
    this.onChangeFn(this.checked);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
