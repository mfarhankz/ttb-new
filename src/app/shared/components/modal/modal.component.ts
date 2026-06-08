import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './modal.component.html',
  styles: []
})
export class ModalComponent {
  @Input() id = 'modal';
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() showCloseButton = true;
  @Input() showFooter = true;
  @Input() backdropClickable = true;
  @Input() closeOnBackdropClick = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  isOpen = signal(false);
  hasFooterContent = false;

  open(): void {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpen.set(false);
    document.body.style.overflow = '';
    this.onClose.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdropClick && this.backdropClickable) {
      this.close();
    }
  }

  getModalClasses(): string {
    const baseClasses =
      'relative z-10 flex max-h-[min(90vh,100%)] w-full flex-col overflow-hidden bg-surface rounded-lg shadow-lg pointer-events-auto';
    
    const sizeClasses = {
      sm: 'w-full max-w-sm',
      md: 'w-full max-w-md',
      lg: 'w-full max-w-lg',
      xl: 'w-full max-w-xl',
      full: 'w-full max-w-7xl'
    };

    return `${baseClasses} ${sizeClasses[this.size]}`;
  }

  getBodyClasses(): string {
    return 'min-h-0 flex-1 overflow-y-auto px-6 py-4';
  }
}



