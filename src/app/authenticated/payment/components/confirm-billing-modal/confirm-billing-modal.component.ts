import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { BillingConfirmationData } from '@app/core/interfaces/payment.interface';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { PayNowControlStyles } from '@app/authenticated/payment/components/pay-now-modal/pay-now-control.styles';

@Component({
  selector: 'app-confirm-billing-modal',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, InputText, ModalComponent, ButtonComponent],
  templateUrl: './confirm-billing-modal.component.html'
})
export class ConfirmBillingModalComponent {
  @Input({ required: true }) billing!: BillingConfirmationData;
  @Input() extraCreditAmount = 0;
  @Input() showFarmName = true;

  @Output() confirmed = new EventEmitter<{ farmName: string }>();
  @Output() cancelled = new EventEmitter<void>();

  readonly farmName = signal('');
  readonly inputClass = PayNowControlStyles.input;

  @ViewChild('confirmModal') private modal?: ModalComponent;

  open(): void {
    this.farmName.set(this.billing.farmName ?? this.billing.product ?? '');
    this.modal?.open();
  }

  close(): void {
    this.modal?.close();
  }

  onConfirm(): void {
    this.confirmed.emit({ farmName: this.farmName().trim() });
    this.close();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.close();
  }
}
