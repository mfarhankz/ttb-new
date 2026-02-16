import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styles: []
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() title = '';
  @Input() icon = true;
  @Input() dismissible = false;
  @Output() onDismiss = new EventEmitter<void>();

  getAlertClasses(): string {
    const baseClasses = 'rounded-md p-4';
    
    const typeClasses = {
      success: 'bg-green-50 border border-green-200',
      error: 'bg-red-50 border border-red-200',
      warning: 'bg-yellow-50 border border-yellow-200',
      info: 'bg-blue-50 border border-blue-200'
    };

    return `${baseClasses} ${typeClasses[this.type]}`;
  }

  getIconClasses(): string {
    const iconMap = {
      success: 'pi pi-check-circle text-green-400',
      error: 'pi pi-times-circle text-red-400',
      warning: 'pi pi-exclamation-triangle text-yellow-400',
      info: 'pi pi-info-circle text-blue-400'
    };
    return iconMap[this.type];
  }

  getTitleClasses(): string {
    const typeClasses = {
      success: 'text-green-800',
      error: 'text-red-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800'
    };
    return `text-sm font-medium ${typeClasses[this.type]}`;
  }

  getMessageClasses(): string {
    const typeClasses = {
      success: 'text-green-700',
      error: 'text-red-700',
      warning: 'text-yellow-700',
      info: 'text-blue-700'
    };
    return `text-sm ${typeClasses[this.type]}`;
  }

  getDismissButtonClasses(): string {
    const typeClasses = {
      success: 'text-green-500 hover:bg-green-100 focus:ring-green-600',
      error: 'text-red-500 hover:bg-red-100 focus:ring-red-600',
      warning: 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600',
      info: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
    };
    return `inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${typeClasses[this.type]}`;
  }
}

