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
  @Input() compact = false;
  @Output() onDismiss = new EventEmitter<void>();

  getAlertClasses(): string {
    const padding = this.compact ? 'rounded-md py-2 px-3' : 'rounded-md p-4';
    
    const typeClasses = {
      success: 'bg-success/10 border border-success/25',
      error: 'bg-danger/10 border border-danger/25',
      warning: 'bg-warning/10 border border-warning/25',
      info: 'bg-info/10 border border-info/25'
    };

    return `${padding} ${typeClasses[this.type]}`;
  }

  getIconClasses(): string {
    const iconMap = {
      success: 'pi pi-check-circle text-success',
      error: 'pi pi-times-circle text-danger',
      warning: 'pi pi-exclamation-triangle text-warning',
      info: 'pi pi-info-circle text-info'
    };
    return iconMap[this.type];
  }

  getTitleClasses(): string {
    const typeClasses = {
      success: 'text-success',
      error: 'text-danger',
      warning: 'text-warning',
      info: 'text-info'
    };
    return `text-body-sm font-medium ${typeClasses[this.type]}`;
  }

  getMessageClasses(): string {
    const typeClasses = {
      success: 'text-success',
      error: 'text-danger',
      warning: 'text-warning',
      info: 'text-info'
    };
    return `text-body-sm ${typeClasses[this.type]}`;
  }

  getContentClasses(): string {
    return [this.title ? 'mt-2' : '', this.getMessageClasses()].filter(Boolean).join(' ');
  }

  getDismissButtonClasses(): string {
    const typeClasses = {
      success: 'text-success hover:bg-success/10 focus:ring-success',
      error: 'text-danger hover:bg-danger/10 focus:ring-danger',
      warning: 'text-warning hover:bg-warning/10 focus:ring-warning',
      info: 'text-info hover:bg-info/10 focus:ring-info'
    };
    return `inline-flex rounded-md p-1.5 focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${typeClasses[this.type]}`;
  }
}

