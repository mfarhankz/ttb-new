import { Component, inject, viewChild, effect } from '@angular/core';
import { NetSheetModalService } from '@app/features/net-sheet/services/net-sheet-modal.service';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { NetSheetComponent } from './net-sheet.component';

@Component({
  selector: 'app-net-sheet-modal-host',
  standalone: true,
  imports: [ModalComponent, NetSheetComponent],
  template: `
    @if (modalService.activeConfig(); as config) {
      <app-modal
        #modal
        id="net-sheet-modal"
        [title]="config.isBlankMode ? 'Buyer Cost Estimate' : (config.propertyAddress ?? 'Net Sheet')"
        size="full"
        [showFooter]="false"
        (onClose)="onModalClosed()"
      >
        <app-net-sheet [config]="config" (closed)="requestClose()" />
      </app-modal>
    }
  `
})
export class NetSheetModalHostComponent {
  readonly modalService = inject(NetSheetModalService);
  private readonly modal = viewChild<ModalComponent>('modal');

  constructor() {
    effect(() => {
      if (this.modalService.activeConfig()) {
        setTimeout(() => this.modal()?.open(), 0);
        // Let the modal finish layout before map tiles paint.
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
      }
    });
  }

  /** User dismissed the modal (X / backdrop); UI is already closing. */
  onModalClosed(): void {
    this.modalService.close();
  }

  /** Ask the modal shell to close; it will emit onClose → onModalClosed(). */
  requestClose(): void {
    this.modal()?.close();
  }
}
