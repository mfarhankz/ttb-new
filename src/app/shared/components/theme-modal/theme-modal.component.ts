import { Component, effect, inject, viewChild } from '@angular/core';
import { ThemeModalService } from '@app/core/services/theme-modal.service';
import { ThemeService } from '@app/core/services/theme.service';
import {
  THEME_VARIANT_OPTIONS,
  ThemeVariant
} from '@app/core/theme/theme.config';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-theme-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './theme-modal.component.html',
  styles: []
})
export class ThemeModalComponent {
  private readonly modalService = inject(ThemeModalService);
  private readonly themeService = inject(ThemeService);
  private readonly modal = viewChild.required<ModalComponent>('modal');

  readonly options = THEME_VARIANT_OPTIONS;

  constructor() {
    effect(() => {
      const modal = this.modal();
      if (!modal) return;

      if (this.modalService.isOpen()) {
        modal.open();
      } else if (modal.isOpen()) {
        modal.close();
      }
    });
  }

  selectedVariant(): ThemeVariant {
    return this.themeService.variant();
  }

  isSelected(variant: ThemeVariant): boolean {
    return this.selectedVariant() === variant;
  }

  selectVariant(variant: ThemeVariant): void {
    this.themeService.setVariant(variant);
  }

  onModalClose(): void {
    this.modalService.close();
  }
}
