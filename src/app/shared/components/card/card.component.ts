import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styles: []
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() footer = false;
  @Input() headerActions = false;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() shadow: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() bordered = true;
  @Input() hover = false;

  getCardClasses(): string {
    const baseClasses = 'bg-surface rounded-lg';
    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    };
    const borderClass = this.bordered ? 'border border-border' : '';
    const hoverClass = this.hover ? 'transition-shadow hover:shadow-lg' : '';

    return `${baseClasses} ${shadowClasses[this.shadow]} ${borderClass} ${hoverClass}`;
  }

  getTitleClasses(): string {
    return 'text-h3 font-semibold text-foreground';
  }

  getBodyClasses(): string {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return paddingClasses[this.padding];
  }
}

