import { Component, computed, effect, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { OverlayOnShowEvent, OverlayOptions } from 'primeng/api';
import { Select } from 'primeng/select';
import { ThemeModalService } from '@app/core/services/theme-modal.service';
import { ThemeService } from '@app/core/services/theme.service';
import {
  FONT_FAMILY_OPTIONS,
  THEME_VARIANT_OPTIONS,
  ThemeFontFamily,
  ThemeVariant,
  getFontFamilyOption
} from '@app/core/theme/theme.config';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-theme-modal',
  standalone: true,
  imports: [ModalComponent, Select, FormsModule],
  templateUrl: './theme-modal.component.html',
  styles: []
})
export class ThemeModalComponent {
  private readonly modalService = inject(ThemeModalService);
  private readonly themeService = inject(ThemeService);
  private readonly modal = viewChild.required<ModalComponent>('modal');

  readonly options = THEME_VARIANT_OPTIONS;
  readonly fontSelectOptions = FONT_FAMILY_OPTIONS.map((option) => ({
    label: option.label,
    value: option.id
  }));

  readonly selectedFontHint = computed(
    () => getFontFamilyOption(this.themeService.fontFamily()).description
  );

  readonly fontSelectOverlayOptions: OverlayOptions = {
    onShow: (event) => this.repositionFontSelectOverlay(event)
  };

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

  selectedFontFamily(): ThemeFontFamily {
    return this.themeService.fontFamily();
  }

  isSelected(variant: ThemeVariant): boolean {
    return this.selectedVariant() === variant;
  }

  selectVariant(variant: ThemeVariant): void {
    this.themeService.setVariant(variant);
  }

  onFontFamilyChange(fontFamily: ThemeFontFamily): void {
    this.themeService.setFontFamily(fontFamily);
  }

  onModalClose(): void {
    this.modalService.close();
  }

  /** Flip the panel above the trigger when it would overflow the modal or viewport. */
  private repositionFontSelectOverlay(event?: OverlayOnShowEvent): void {
    const overlay = event?.overlay;
    const target = event?.target as HTMLElement | undefined;
    if (!overlay || !target) {
      return;
    }

    requestAnimationFrame(() => {
      const targetRect = target.getBoundingClientRect();
      const overlayHeight = overlay.offsetHeight || overlay.scrollHeight;
      if (!overlayHeight) {
        return;
      }

      const gutter = 4;
      const dialog = target.closest('[role="dialog"]');
      const dialogRect = dialog?.getBoundingClientRect();
      const overflowsViewport = targetRect.bottom + overlayHeight + gutter > window.innerHeight;
      const overflowsDialog =
        !!dialogRect && targetRect.bottom + overlayHeight + gutter > dialogRect.bottom;

      overlay.style.minWidth = `${targetRect.width}px`;
      overlay.style.left = `${targetRect.left + window.scrollX}px`;

      if (!overflowsViewport && !overflowsDialog) {
        return;
      }

      const top = targetRect.top + window.scrollY - overlayHeight - gutter;
      overlay.style.top = `${Math.max(window.scrollY + gutter, top)}px`;
      overlay.style.transformOrigin = 'bottom';
      overlay.style.marginTop = '0';
    });
  }
}
