import { Component, Input, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../label/label.component';

/**
 * FormField wrapper component that provides consistent styling and error handling
 * for form fields. Use this to wrap your form controls for better UX.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, LabelComponent],
  templateUrl: './form-field.component.html',
  styles: []
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() controlId = '';
  @Input() labelSize: 'sm' | 'md' | 'lg' = 'md';
  @Input() wrapperClass = '';
}

