/**
 * Shared UI Components
 * 
 * This file exports all reusable UI components for easy importing.
 * These components abstract the UI library implementation, making it
 * easy to swap UI libraries in the future.
 */

// Form Components
export { InputComponent } from './input/input.component';
export { SelectComponent, type SelectOption } from './select/select.component';
export { TextareaComponent } from './textarea/textarea.component';
export { CheckboxComponent } from './checkbox/checkbox.component';
export { RadioComponent } from './radio/radio.component';
export { ButtonComponent, type ButtonVariant, type ButtonSize } from './button/button.component';

// Layout Components
export { CardComponent } from './card/card.component';
export { ModalComponent } from './modal/modal.component';

// Feedback Components
export { AlertComponent, type AlertType } from './alert/alert.component';

// Utility Components
export { LabelComponent } from './label/label.component';
export { FormFieldComponent } from './form-field/form-field.component';

