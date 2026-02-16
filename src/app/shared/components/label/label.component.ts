import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label.component.html',
  styles: []
})
export class LabelComponent {
  @Input() for = '';
  @Input() required = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  getLabelClasses(): string {
    const baseClasses = 'block font-medium text-gray-700';
    
    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };

    return `${baseClasses} ${sizeClasses[this.size]}`;
  }
}

