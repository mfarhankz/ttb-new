import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
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
    const baseClasses = 'relative bg-white rounded-lg shadow-xl transform transition-all pointer-events-auto';
    
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
    return 'px-6 py-4';
  }
}



