import { CurrencyPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { EMPTY, catchError, finalize, map, of, switchMap } from 'rxjs';
import {
  BillingConfirmationData,
  CREDIT_AMOUNT_SUGGESTIONS,
  CardBillingFormValue,
  CreditPurchaseSuccessData,
  PayNowOptions,
  PayNowResult,
  PaymentMethod,
  PaymentStepPayload,
  RecsPurchaseSuccessData
} from '@app/core/interfaces/payment.interface';
import { AuthService } from '@app/core/services/auth.service';
import { PaymentService } from '@app/core/services/payment.service';
import { PayNowModalService } from '@app/core/services/pay-now-modal.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { WalletService } from '@app/core/services/wallet.service';
import {
  buildTbBillingFromForm,
  computeExtraCreditAmount,
  detectCardType,
  blockCardNumberKeydown,
  blockNonDigitKeydown,
  formatCardExpiryInput,
  formatCardNumberInput,
  formatSecurityCodeInput,
  isValidCardNumber,
  isValidSecurityCode,
  parseCardExpiry
} from '@app/core/utils/payment-billing.util';
import { SavedFarmRecord } from '@app/core/interfaces/saved-farm.interface';
import { AlertComponent } from '../alert/alert.component';
import { ButtonComponent } from '../button/button.component';
import { ModalComponent } from '../modal/modal.component';
import { ConfirmBillingModalComponent } from '../confirm-billing-modal/confirm-billing-modal.component';
import { PaymentCardPreviewComponent } from '../payment-card-preview/payment-card-preview.component';
import { PayNowControlStyles } from './pay-now-control.styles';

@Component({
  selector: 'app-pay-now-modal',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    InputText,
    Checkbox,
    ModalComponent,
    ButtonComponent,
    AlertComponent,
    ConfirmBillingModalComponent,
    PaymentCardPreviewComponent
  ],
  templateUrl: './pay-now-modal.component.html'
})
export class PayNowModalComponent {
  @Input({ required: true }) options!: PayNowOptions;
  @Output() closed = new EventEmitter<void>();

  private readonly modal = viewChild<ModalComponent>('payNowModal');
  @ViewChild('confirmBillingModal') confirmBillingModal?: ConfirmBillingModalComponent;

  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly paymentService = inject(PaymentService);
  private readonly payNowModalService = inject(PayNowModalService);
  private readonly verticalService = inject(VerticalService);
  private readonly walletService = inject(WalletService);

  readonly amountSuggestions = CREDIT_AMOUNT_SUGGESTIONS;
  readonly creditRechargeSuggestions = [5, 100, 200, 300, 400, 500] as const;
  readonly inputClass = PayNowControlStyles.input;
  readonly blockNonDigitKeydown = blockNonDigitKeydown;
  readonly cvcFocused = signal(false);
  readonly paymentMethod = signal<PaymentMethod | null>('card');
  readonly farmName = signal('');
  readonly emailCsv = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorMessages = signal<string[] | null>(null);
  readonly warningMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly savedFarm = signal<SavedFarmRecord | null>(null);
  readonly hideDisplayRecords = signal(false);

  readonly billingConfirmation = signal<BillingConfirmationData | null>(null);
  readonly extraCreditAmount = signal(0);

  readonly form = signal<CardBillingFormValue>(this.createDefaultForm());

  private confirmResolver: ((value: BillingConfirmationData | null) => void) | null = null;
  private suppressDismiss = false;
  private didInit = false;

  readonly walletEnabled = computed(
    () => this.verticalService.content()?.app_config?.support_wallet !== false
  );

  readonly minimumPurchaseAmount = computed(() => {
    const configured = Number(this.verticalService.content()?.app_config?.['minimum_purchase_amount']);
    return Number.isFinite(configured) && configured > 0 ? configured : 5;
  });

  readonly priceRequired = computed(() => Number(this.options.priceRequired ?? 0));
  readonly walletBalance = computed(() => this.walletService.balance() ?? 0);
  readonly walletLoading = this.walletService.loading;

  readonly isCreditRecharge = computed(() => this.options.mode === 'creditRecharge');
  readonly isRecsPurchase = computed(() => this.options.mode === 'recsPurchase');
  readonly isMinimumPurchase = computed(() => this.isRecsPurchase());

  readonly insufficientBalance = computed(
    () => this.walletBalance() < this.priceRequired()
  );

  readonly isNotRecharge = computed(
    () => this.isMinimumPurchase() && this.priceRequired() < this.minimumPurchaseAmount()
  );

  readonly isNotPurchaseRecs = computed(
    () => this.insufficientBalance() && !this.isMinimumPurchase()
  );

  readonly showPaymentMethodChoices = computed(
    () => !this.isCreditRecharge() && this.walletEnabled()
  );

  readonly showCardForm = computed(() => {
    if (this.isCreditRecharge()) {
      return true;
    }

    return this.paymentMethod() === 'card' && !this.isNotRecharge();
  });

  readonly showCreditFarmName = computed(
    () =>
      this.isRecsPurchase() &&
      this.paymentMethod() === 'credit' &&
      !this.insufficientBalance()
  );

  readonly payButtonDisabled = computed(() => {
    if (this.submitting() || this.walletLoading()) {
      return true;
    }

    const method = this.paymentMethod();
    if (!method) {
      return true;
    }

    if (method === 'credit') {
      return this.insufficientBalance();
    }

    return this.isNotRecharge();
  });

  readonly hidePayButton = computed(() => !this.paymentMethod());

  readonly cardType = computed(() => detectCardType(this.form().number));

  readonly cardholderDisplayName = computed(() => {
    const value = this.form();
    return `${value.firstName} ${value.lastName}`.trim();
  });

  constructor() {
    effect(() => {
      const modal = this.modal();
      if (!modal) {
        return;
      }

      if (!modal.isOpen()) {
        modal.open();
      }

      if (!this.didInit) {
        this.didInit = true;
        this.refreshExtraCreditAmount();

        if (this.isCreditRecharge()) {
          this.paymentMethod.set('card');
        } else {
          this.walletService.fetchBalance(true);
        }
      }
    });

    effect(() => {
      if (this.isCreditRecharge()) {
        return;
      }

      this.walletBalance();
      this.walletLoading();
      this.initializePaymentMethod();
    });
  }

  handleModalDismiss(): void {
    if (this.suppressDismiss) {
      return;
    }

    this.payNowModalService.dismiss();
    this.closed.emit();
  }

  private closeModalShell(): void {
    this.suppressDismiss = true;
    this.modal()?.close();
    this.suppressDismiss = false;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    if (method === 'credit' && (this.isNotPurchaseRecs() || this.insufficientBalance())) {
      return;
    }

    if (method === 'card' && this.isNotRecharge()) {
      return;
    }

    this.paymentMethod.set(method);
    this.clearErrors();
  }

  inlineRechargeWallet(): void {
    const resumeOptions = this.options;
    this.closeModalShell();
    this.payNowModalService.dismiss();

    setTimeout(() => {
      this.payNowModalService.open({ mode: 'creditRecharge' }).subscribe(() => {
        setTimeout(() => {
          this.payNowModalService.open(resumeOptions).subscribe();
        }, 400);
      });
    }, 400);
  }

  updateForm(patch: Partial<CardBillingFormValue>): void {
    this.form.update((current) => ({ ...current, ...patch }));
    if ('amount' in patch) {
      this.refreshExtraCreditAmount();
    }
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatCardNumberInput(input.value);

    if (input.value !== formatted) {
      input.value = formatted;
    }

    if (this.form().number !== formatted) {
      this.updateForm({ number: formatted });
    }
  }

  onCardNumberKeydown(event: KeyboardEvent): void {
    blockCardNumberKeydown(event, this.form().number);
  }

  updateCardExpiry(value: string): void {
    this.updateForm({ expiry: formatCardExpiryInput(value) });
  }

  updateSecurityCode(value: string): void {
    this.updateForm({ securityCode: formatSecurityCodeInput(value) });
  }

  setAmountSuggestion(amount: number): void {
    this.updateForm({ amount });
  }

  isAmountSelected(amount: number): boolean {
    return this.form().amount === amount;
  }

  amountSuggestionButtonClass(amount: number): string {
    const base =
      'inline-flex h-9.5 min-h-9.5 items-center rounded-md border-2 border-primary px-3 text-sm font-medium transition-colors';

    return this.isAmountSelected(amount)
      ? `${base} bg-primary text-primary-foreground shadow-sm`
      : `${base} bg-transparent text-primary hover:bg-primary/10`;
  }

  paySecure(): void {
    this.submitted.set(true);
    this.clearErrors();

    const method = this.paymentMethod();
    if (!method) {
      return;
    }

    if (method === 'card' && !this.validateCardForm()) {
      return;
    }

    this.submitting.set(true);

    const verifyPayload = this.buildVerifyPayload(method);

    this.runVerifyStep(method, verifyPayload)
      .pipe(
        switchMap((verifyData) => {
          if (method === 'card' && !verifyData) {
            return EMPTY;
          }

          return this.runConfirmStep(method, verifyData);
        }),
        finalize(() => this.submitting.set(false)),
        catchError((reason) => {
          this.handlePaymentError(reason);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        if (result) {
          this.handlePaymentSuccess(result);
        }
      });
  }

  onConfirmBilling(result: { farmName: string }): void {
    const billing = this.billingConfirmation();
    if (!billing || !this.confirmResolver) {
      return;
    }

    this.confirmResolver({ ...billing, farmName: result.farmName });
    this.confirmResolver = null;
  }

  onConfirmBillingCancelled(): void {
    this.cancelPayment().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.confirmResolver?.(null);
    this.confirmResolver = null;
  }

  displayRecords(): void {
    const farm = this.savedFarm();
    if (!farm) {
      return;
    }

    const result: PayNowResult = {
      mode: this.options.mode,
      savedFarm: farm,
      message: this.successMessage() ?? undefined
    };

    this.payNowModalService.complete(result);
    this.closeModalShell();
  }

  dismissWarning(): void {
    this.warningMessage.set(null);
    this.handleModalDismiss();
    this.closeModalShell();
  }

  private initializePaymentMethod(): void {
    if (this.isNotRecharge() && this.insufficientBalance()) {
      this.paymentMethod.set(null);
      return;
    }

    if (!this.insufficientBalance()) {
      this.paymentMethod.set('credit');
      return;
    }

    this.paymentMethod.set('card');
  }

  private createDefaultForm(): CardBillingFormValue {
    const user = this.authService.tbUser();
    const phones = this.authService.tbPhone();
    const emails = this.authService.tbEmail();
    const addresses = this.authService.tbAddress();
    const accountAddress = addresses?.[0];

    return {
      number: '',
      firstName: user?.first_name ?? '',
      lastName: user?.last_name ?? '',
      expiry: '',
      securityCode: '',
      phone: phones?.[0]?.phone != null ? String(phones[0].phone) : '',
      email: emails?.[0]?.email ?? user?.username ?? '',
      amount: null,
      billingAddressIsSame: false,
      address: accountAddress?.address ?? '',
      address2: accountAddress?.address_2 ?? '',
      city: accountAddress?.city ?? '',
      state: accountAddress?.state ?? '',
      zip: accountAddress?.zip ?? ''
    };
  }

  private refreshExtraCreditAmount(): void {
    const amount = this.form().amount;
    const appConfig = this.verticalService.content()?.app_config as Record<string, unknown> | undefined;
    this.extraCreditAmount.set(computeExtraCreditAmount(amount, appConfig));
  }

  private validateCardForm(): boolean {
    const value = this.form();

    if (!value.number.trim()) {
      this.errorMessage.set('Card Number is required.');
      return false;
    }

    if (!isValidCardNumber(value.number)) {
      this.errorMessage.set('Please enter a valid card number.');
      return false;
    }

    if (!value.firstName.trim()) {
      this.errorMessage.set('Billing first name can not be blank.');
      return false;
    }

    if (!value.lastName.trim()) {
      this.errorMessage.set('Billing last name can not be blank.');
      return false;
    }

    if (!value.expiry.trim()) {
      this.errorMessage.set('Card expiry is required.');
      return false;
    }

    if (!parseCardExpiry(value.expiry)) {
      this.errorMessage.set('Invalid card expiry. Use MM/YYYY format.');
      return false;
    }

    if (!value.securityCode.trim()) {
      this.errorMessage.set('Billing security code can not be blank.');
      return false;
    }

    if (!isValidSecurityCode(value.securityCode, detectCardType(value.number))) {
      this.errorMessage.set(
        detectCardType(value.number) === 'Amex'
          ? 'American Express security code must be 4 digits.'
          : 'Security code must be 3 digits.'
      );
      return false;
    }

    if (!value.phone.trim()) {
      this.errorMessage.set('Phone number is required.');
      return false;
    }

    if (!value.email.trim()) {
      this.errorMessage.set('Email is required.');
      return false;
    }

    if (this.isCreditRecharge()) {
      const amount = Number(value.amount);
      if (!Number.isFinite(amount)) {
        this.errorMessage.set('Please specify amount to recharge credit with.');
        return false;
      }

      if (amount < this.minimumPurchaseAmount()) {
        this.errorMessage.set(`Please use amount greater than $${this.minimumPurchaseAmount()}.`);
        return false;
      }
    }

    if (!value.billingAddressIsSame) {
      if (!value.address.trim() || !value.city.trim() || !value.state.trim() || !value.zip.trim()) {
        this.errorMessage.set('Please complete the billing address fields.');
        return false;
      }
    }

    return true;
  }

  private buildVerifyPayload(method: PaymentMethod): PaymentStepPayload {
    if (method === 'credit') {
      return {};
    }

    const billing = buildTbBillingFromForm(
      this.form(),
      this.authService.tbUser()?.users_id,
      this.authService.tbAddress()?.[0]
    );

    return {
      TbBilling: billing,
      action: 'verify_cc',
      payment_method: 'credit card'
    };
  }

  private runVerifyStep(method: PaymentMethod, payload: PaymentStepPayload) {
    if (method === 'credit') {
      return of(null);
    }

    const request$ = this.isCreditRecharge()
      ? this.paymentService.purchaseCreditStep(payload)
      : this.paymentService.purchaseRecsStep(payload);

    return request$.pipe(
      switchMap((data) => {
        const confirmation = data as BillingConfirmationData;
        this.billingConfirmation.set({
          ...confirmation,
          farmName: confirmation.product
        });

        return new Promise<BillingConfirmationData | null>((resolve) => {
          this.confirmResolver = resolve;
          setTimeout(() => this.confirmBillingModal?.open(), 0);
        });
      })
    );
  }

  private runConfirmStep(method: PaymentMethod, verifyData: BillingConfirmationData | null) {
    const farmName =
      method === 'credit'
        ? this.farmName().trim()
        : verifyData?.farmName?.trim() ?? verifyData?.product?.trim() ?? '';

    const confirmPayload: PaymentStepPayload = {
      action: 'confirm',
      payment_method: method === 'credit' ? 'credit' : 'credit card'
    };

    if (this.isRecsPurchase() && farmName) {
      confirmPayload.name = farmName;
    }

    if (this.options.enableExcelExport) {
      confirmPayload.email_csv_on_complete = this.emailCsv();
    }

    if (method === 'card') {
      confirmPayload.TbBilling = buildTbBillingFromForm(
        this.form(),
        this.authService.tbUser()?.users_id,
        this.authService.tbAddress()?.[0]
      );
    }

    const request$ = this.isCreditRecharge()
      ? this.paymentService.purchaseCreditStep(confirmPayload)
      : this.paymentService.purchaseRecsStep(confirmPayload);

    return request$.pipe(map((data) => this.mapPaymentResult(data, farmName)));
  }

  private mapPaymentResult(
    data: RecsPurchaseSuccessData | CreditPurchaseSuccessData,
    farmName: string
  ): PayNowResult {
    if (this.isCreditRecharge()) {
      const creditData = data as CreditPurchaseSuccessData;
      return {
        mode: 'creditRecharge',
        wallet: creditData.user_wallet,
        promotionalCreditAmount: Number(creditData.promotional_credit_amount) || 0,
        message: creditData.msg ?? 'Credit has been added successfully.'
      };
    }

    const recsData = data as RecsPurchaseSuccessData;
    if (!recsData.saved_farm || recsData.error) {
      throw { data: { error: recsData.error ?? 'Something went wrong.' } };
    }

    const savedFarm = recsData.saved_farm;
    if (!savedFarm.name && farmName) {
      savedFarm.name = farmName;
    }

    return {
      mode: 'recsPurchase',
      savedFarm,
      wallet: recsData.user_wallet,
      promotionalCreditAmount: Number(recsData.promotional_credit_amount) || 0,
      message: recsData.msg
    };
  }

  private cancelPayment() {
    const payload: PaymentStepPayload = { action: 'cancel' };
    const request$ = this.isCreditRecharge()
      ? this.paymentService.purchaseCreditStep(payload)
      : this.paymentService.purchaseRecsStep(payload);

    return request$.pipe(catchError(() => EMPTY));
  }

  private handlePaymentSuccess(result: PayNowResult): void {
    this.walletService.fetchBalance(true);

    if (this.isCreditRecharge()) {
      this.hideDisplayRecords.set(true);
      this.successMessage.set(result.message ?? 'Credit has been added successfully.');
      this.payNowModalService.complete(result);
      this.closeModalShell();
      return;
    }

    const farm = result.savedFarm;
    if (!farm) {
      this.errorMessage.set('Something went wrong. Please report to the technical team.');
      return;
    }

    this.savedFarm.set(farm);
    this.successMessage.set(this.buildRecsSuccessMessage(farm, result.message));
    this.hideDisplayRecords.set(false);
  }

  private buildRecsSuccessMessage(farm: SavedFarmRecord, baseMessage?: string): string {
    const parts = [baseMessage ?? 'Your payment was processed successfully'];
    const label = this.options.contactIncluded ? 'Est. Total Records: ' : 'Total Records: ';
    parts.push(`${label}${farm.farm_record_count ?? ''}`);
    parts.push(`Farm Name: ${farm.name ?? ''}`);

    if (this.options.contactIncluded) {
      parts.push(
        'Note: Information lookup can take some time, please refresh your Saved Farm to check status (after ~2 minutes). Your card has been authorized for the estimated amount based off of predicted percentage. The final charge amount may be higher or lower based off of located records.'
      );
    }

    parts.push(
      `Note: Records will be saved as a "${farm.name ?? 'farm'}" and actively updated for the next 15 days. After 15 days any Mortgage and/or Lead information will not be available for the list. Records will remain saved within the farm with assessor information only. Please export the list before the 15 days are up to avoid losing that data.`
    );

    return parts.join('\n');
  }

  private handlePaymentError(reason: unknown): void {
    const parsed = this.paymentService.parsePaymentError(reason);

    if (parsed.isWarning) {
      this.warningMessage.set(parsed.message);
      this.errorMessage.set(null);
      this.errorMessages.set(null);
      return;
    }

    this.warningMessage.set(null);
    this.errorMessage.set(parsed.message);
    this.errorMessages.set(parsed.messages);
  }

  private clearErrors(): void {
    this.errorMessage.set(null);
    this.errorMessages.set(null);
    this.warningMessage.set(null);
    this.submitted.set(false);
  }
}
