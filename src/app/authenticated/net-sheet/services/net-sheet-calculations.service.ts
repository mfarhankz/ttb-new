import { Injectable } from '@angular/core';
import {
  NET_SHEET_PAYER_BASED_FIELDS,
  NET_SHEET_SKIPPED_SUBTOTAL_FIELDS
} from '@app/authenticated/net-sheet/config/net-sheet.config';
import { NetSheetData, NetSheetPayerValues, NetSheetTabId } from '@app/core/interfaces/net-sheet.interface';
import {
  netSheetPercentOfSale,
  netSheetSum,
  netSheetToFixed,
  netSheetValueToPercent,
  shouldSkipSubtotalField
} from '@app/core/utils/net-sheet.util';

export interface NetSheetCalcContext {
  activeTab: NetSheetTabId;
  isBlankMode?: boolean;
  isLoanTypeAllCash?: boolean;
  payerValues: NetSheetPayerValues;
}

type TabRecord = Record<string, Record<string, unknown>>;

@Injectable({ providedIn: 'root' })
export class NetSheetCalculationsService {
  runBuyerInitialCalculation(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, 'buyer');
    this.prepaidDefaults(tabData);

    this.calculateSettlementFieldValue(tabData, 'Discount', true);
    this.calculateSettlementFieldValue(tabData, 'Origination Fee', false);
    this.calculateNewLoanValue(data, context);
    this.calculatePrepaids(data, context);
    this.getPrincipalInterestRate(data, context);
    this.calculateSubtotalSettlementServices(data, context);
  }

  recalculateBuyer(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateSubtotalSettlementServices(data, context);
  }

  applyVariableFees(
    data: NetSheetData,
    context: NetSheetCalcContext,
    fees: Record<string, number | string>
  ): void {
    const tabData = this.tab(data, context.activeTab);

    for (const [fieldName, fieldValue] of Object.entries(fees)) {
      const numeric = netSheetToFixed(fieldValue);
      if (tabData['Settlement Services']?.[fieldName] !== undefined) {
        tabData['Settlement Services'][fieldName] = numeric;
      }
      if (tabData['Other Expenses']?.[fieldName] !== undefined) {
        tabData['Other Expenses'][fieldName] = numeric;
      }
    }

    if (tabData['Totals']?.['LESS Tax Proration'] !== undefined && fees['Tax Proration'] != null) {
      tabData['Totals']['LESS Tax Proration'] = netSheetToFixed(fees['Tax Proration']);
    }

    this.syncPayerValues(data, context.activeTab);
    this.recalculateActiveTab(data, context);
  }

  runSellerInitialCalculation(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateSubtotalEncumbrances(data, context);
    this.calculateSubtotalSettlementServices(data, context);
  }

  runRefinanceInitialCalculation(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateSubtotalEncumbrances(data, context);
    this.calculateSubtotalSettlementServices(data, context);
    this.calculatePrepaids(data, context);
    this.calculateTotalNewLoanCombined(data, context);
  }

  recalculateSeller(data: NetSheetData, context: NetSheetCalcContext): void {
    this.runSellerInitialCalculation(data, context);
  }

  recalculateActiveTab(data: NetSheetData, context: NetSheetCalcContext): void {
    const tab = context.activeTab;
    if (tab === 'buyer') {
      this.runBuyerInitialCalculation(data, context);
      return;
    }

    if (tab === 'refinance') {
      this.runRefinanceInitialCalculation(data, context);
      return;
    }

    if (tab === 'seller' || tab === 'net2sell') {
      this.runSellerInitialCalculation(data, context);
    }
  }

  onBrokeragePercentChange(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateBrokerageFeesValue(data, context);
  }

  onBrokerageValueChange(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateBrokerageFeesPercent(data, context);
  }

  onEncumbranceChange(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateSubtotalEncumbrances(data, context);
  }

  /**
   * Legacy findTargetSalesPriceForNet2Sell / getSalesPrice —
   * iterates Sales Price until Estimated Total Seller Proceeds matches Net Goal.
   */
  findTargetSalesPriceForNet2Sell(data: NetSheetData, context: NetSheetCalcContext): number {
    const tabData = this.tab(data, 'net2sell');
    const general = tabData['General Info'] ?? {};
    const netGoalValue = Number(general['Net Goal For Seller']) || 0;
    if (!netGoalValue) {
      return 0;
    }

    const allowedProceedsDiff = (netGoalValue / 100) * 0.002;
    let nextPrice = netGoalValue;
    const solveContext: NetSheetCalcContext = { ...context, activeTab: 'net2sell' };
    const maxIterations = 360_000;

    for (let i = 0; i < maxIterations; i++) {
      general['Sales Price'] = nextPrice;
      tabData['General Info'] = general;
      this.runSellerInitialCalculation(data, solveContext);

      const totals = tabData['Totals'] ?? {};
      const proceedsValue = Number(totals['Estimated Total Seller Proceeds']) || 0;
      const xSum = Number(totals['Estimated X Sum']) || 0;
      const salesPrice = proceedsValue + xSum;

      if (proceedsValue === netGoalValue) {
        return salesPrice;
      }

      if (netGoalValue - proceedsValue < allowedProceedsDiff && netGoalValue - proceedsValue > 0) {
        return salesPrice;
      }

      if (proceedsValue - netGoalValue < allowedProceedsDiff && proceedsValue - netGoalValue > 0) {
        return salesPrice;
      }

      nextPrice += allowedProceedsDiff;
    }

    return 0;
  }

  syncPayerValues(data: NetSheetData, tab: NetSheetTabId): void {
    const tabData = this.tab(data, tab);
    const settlement = tabData['Settlement Services'] ?? {};

    for (const fieldName of NET_SHEET_PAYER_BASED_FIELDS) {
      contextSet(contextPayerValues(data, tab), fieldName, settlement[fieldName]);
      const salesTaxField = `${fieldName} Sales Tax`;
      if (settlement[salesTaxField] !== undefined) {
        contextSet(contextPayerValues(data, tab), salesTaxField, settlement[salesTaxField]);
      }
    }
  }

  onSalesPriceChange(data: NetSheetData, context: NetSheetCalcContext): void {
    this.onNewLoanPercentChange(data, context);
  }

  onNewLoanPercentChange(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateNewLoanValue(data, context);
  }

  onNewLoanValueChange(data: NetSheetData, context: NetSheetCalcContext): void {
    this.calculateNewLoanPercent(data, context);
  }

  onDownPaymentChange(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, 'buyer');
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    tabData['Encumbrances'] = tabData['Encumbrances'] ?? {};
    tabData['New Loan'] = tabData['New Loan'] ?? {};
    tabData['New Loan']['First Loan'] = netSheetToFixed(
      salesPrice - (Number(tabData['Encumbrances']['Down Payment']) || 0)
    );
    this.onNewLoanValueChange(data, context);
  }

  onPayerChange(
    data: NetSheetData,
    context: NetSheetCalcContext,
    fieldName: string,
    payer: string
  ): void {
    const tabData = this.tab(data, context.activeTab);
    const settlement = tabData['Settlement Services'] ?? {};
    const stored = context.payerValues[context.activeTab][fieldName] ?? 0;
    settlement[fieldName] = this.payerAdjustedValue(context.activeTab, payer, stored);

    const salesTaxField = `${fieldName} Sales Tax`;
    if (settlement[salesTaxField] !== undefined) {
      const storedTax = context.payerValues[context.activeTab][salesTaxField] ?? 0;
      settlement[salesTaxField] = this.payerAdjustedValue(context.activeTab, payer, storedTax);
    }

    this.calculateSubtotalSettlementServices(data, context);
  }

  private calculateNewLoanValue(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    const newLoan = tabData['New Loan'] ?? {};

    newLoan['First Loan'] = netSheetPercentOfSale(newLoan['First Loan Percent'], salesPrice);
    newLoan['Second Loan'] = netSheetPercentOfSale(newLoan['Second Loan Percent'], salesPrice);
    tabData['New Loan'] = newLoan;

    this.calculatePaymentPmi(data, context);
    this.calculateSettlementFieldValue(tabData, 'Discount', true);
    this.calculateSettlementFieldValue(tabData, 'Origination Fee', false);
    this.calculateTotalNewLoanCombined(data, context);
  }

  private calculateNewLoanPercent(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    const newLoan = tabData['New Loan'] ?? {};

    newLoan['First Loan Percent'] = netSheetValueToPercent(newLoan['First Loan'], salesPrice);
    newLoan['Second Loan Percent'] = netSheetValueToPercent(newLoan['Second Loan'], salesPrice);
    tabData['New Loan'] = newLoan;

    this.calculatePaymentPmi(data, context);
    this.calculateSettlementFieldValue(tabData, 'Discount', true);
    this.calculateSettlementFieldValue(tabData, 'Origination Fee', false);
    this.calculateTotalNewLoanCombined(data, context);
  }

  private calculateSettlementFieldValue(
    tabData: TabRecord,
    fieldName: string,
    skipSubtotal: boolean
  ): void {
    const settlement = tabData['Settlement Services'] ?? {};
    if (
      settlement[fieldName] === undefined ||
      settlement[`${fieldName} Percent`] === undefined
    ) {
      return;
    }

    const firstLoan = Number(tabData['New Loan']?.['First Loan']) || 0;
    settlement[fieldName] = netSheetToFixed(
      (Number(settlement[`${fieldName} Percent`]) / 100) * firstLoan
    );

    if (!skipSubtotal) {
      // subtotal triggered by caller
    }
  }

  private calculateTotalNewLoanCombined(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const newLoan = tabData['New Loan'] ?? {};
    tabData['Totals'] = tabData['Totals'] ?? {};
    tabData['Totals']['Total New Loans Combined'] = netSheetSum([
      newLoan['First Loan'],
      newLoan['Second Loan']
    ]);

    this.getPrincipalInterestRate(data, context);

    if (context.activeTab === 'buyer') {
      const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
      tabData['Encumbrances'] = tabData['Encumbrances'] ?? {};
      tabData['Encumbrances']['Down Payment'] = netSheetToFixed(
        salesPrice - Number(tabData['Totals']['Total New Loans Combined'])
      );
    }

    this.calculateEstimatedTotals(data, context);
  }

  private calculatePrepaids(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const salesPrice = netSheetToFixed(tabData['General Info']?.['Sales Price']);
    const prepaid = tabData['Prepaid'] ?? {};

    prepaid['Amount of Taxes for x Months'] = netSheetToFixed(
      ((salesPrice * (Number(prepaid['Tax Rate']) || 0)) / 100 / 12) *
        (Number(prepaid['Months of Taxes']) || 0)
    );
    prepaid['Amount of Insurance for x Months'] = netSheetToFixed(
      ((salesPrice * (Number(prepaid['Insurance Rate']) || 0)) / 100 / 12) *
        (Number(prepaid['Months of Insurance']) || 0)
    );
    prepaid['Amount of Interest for x Days'] = netSheetToFixed(
      ((salesPrice * (Number(prepaid['Interest Rate']) || 0)) / 100 / 365) *
        (Number(prepaid['Days of Interest']) || 0)
    );
    tabData['Prepaid'] = prepaid;

    if (context.isBlankMode) {
      this.calculateAnnualTaxes(tabData);
    }

    this.propertyTaxes(tabData);
    this.homeOwnerInsurance(tabData);
    this.calculateSubtotalPrepaid(data, context);
  }

  private calculateAnnualTaxes(tabData: TabRecord): void {
    const prepaid = tabData['Prepaid'] ?? {};
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    tabData['General Info']['Current Annual Taxes'] = netSheetToFixed(
      ((Number(prepaid['Tax Rate']) || 0) / 100) * salesPrice
    );
  }

  private propertyTaxes(tabData: TabRecord): void {
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    const taxRate = Number(tabData['Prepaid']?.['Tax Rate']) || 0;
    tabData['Payment'] = tabData['Payment'] ?? {};
    tabData['Payment']['Property Taxes'] = netSheetToFixed((salesPrice * (taxRate / 100)) / 12);
  }

  private homeOwnerInsurance(tabData: TabRecord): void {
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    const insuranceRate = Number(tabData['Prepaid']?.['Insurance Rate']) || 0;
    tabData['Payment'] = tabData['Payment'] ?? {};
    tabData['Payment']['Homeowner Insurance'] = netSheetToFixed(
      (salesPrice * (insuranceRate / 100)) / 12
    );
  }

  private calculatePaymentPmi(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const newLoan = tabData['New Loan'] ?? {};
    const payment = tabData['Payment'] ?? {};
    const loanType = String(newLoan['First Loan Type'] ?? '');
    const firstLoanPercent = Number(newLoan['First Loan Percent']) || 0;

    if (
      context.activeTab === 'buyer' &&
      ['CONVENTIONAL', 'FHA'].includes(loanType) &&
      firstLoanPercent > 80
    ) {
      payment['Monthly PMI'] = netSheetToFixed(
        (Number(payment['PMI Percent']) * Number(newLoan['First Loan'])) / 100 / 12
      );
    } else if (context.activeTab === 'buyer') {
      payment['Monthly PMI'] = 0;
    } else {
      payment['Monthly PMI'] = netSheetToFixed(
        (Number(payment['PMI Percent']) * Number(newLoan['First Loan'])) / 100 / 12
      );
    }

    tabData['Payment'] = payment;
    this.calculateSubtotalPayment(tabData);
  }

  private getPrincipalInterestRate(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const newLoan = tabData['New Loan'] ?? {};
    const payment = tabData['Payment'] ?? {};

    const firstLoan = Number(newLoan['First Loan']) || 0;
    const secondLoan = Number(newLoan['Second Loan']) || 0;
    const pir = (Number(newLoan['First Loan Interest Rate']) / 100 / 12) || 0;
    const pir2nd = (Number(newLoan['Second Loan Interest Rate']) / 100 / 12) || 0;
    const numFirst = (Number(newLoan['First Loan Terms in Years']) || 0) * 12;
    const numSecond = (Number(newLoan['Second Loan Terms in Years']) || 0) * 12;

    payment['Principal & Interest'] =
      firstLoan && pir && numFirst
        ? netSheetToFixed(
            (firstLoan * pir * Math.pow(1 + pir, numFirst)) / (Math.pow(1 + pir, numFirst) - 1)
          )
        : 0;
    payment['P&I 2nd Loan'] =
      secondLoan && pir2nd && numSecond
        ? netSheetToFixed(
            (secondLoan * pir2nd * Math.pow(1 + pir2nd, numSecond)) /
              (Math.pow(1 + pir2nd, numSecond) - 1)
          )
        : 0;

    tabData['Payment'] = payment;
    this.calculateSubtotalPayment(tabData);
  }

  private calculateSubtotalPayment(tabData: TabRecord): void {
    const payment = tabData['Payment'] ?? {};
    tabData['Totals'] = tabData['Totals'] ?? {};
    tabData['Totals']['Estimate Monthly Payment'] = netSheetSum([
      payment['Principal & Interest'],
      payment['P&I 2nd Loan'],
      payment['Property Taxes'],
      payment['Homeowner Insurance'],
      payment['Monthly PMI'],
      payment['HOA'],
      payment['Other']
    ]);
  }

  private calculateSubtotalPrepaid(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const prepaid = tabData['Prepaid'] ?? {};
    tabData['Totals'] = tabData['Totals'] ?? {};

    if (!context.isLoanTypeAllCash) {
      tabData['Totals']['Total Prepaid Items'] = netSheetSum([
        prepaid['Amount of Taxes for x Months'],
        prepaid['Amount of Insurance for x Months'],
        prepaid['Amount of Interest for x Days']
      ]);
    } else {
      tabData['Totals']['Total Prepaid Items'] = 0;
    }

    this.calculateEstimatedTotals(data, context);
  }

  private calculateSubtotalSettlementServices(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const settlement = tabData['Settlement Services'] ?? {};
    tabData['Totals'] = tabData['Totals'] ?? {};
    let subtotal = 0;

    for (const fieldName of NET_SHEET_PAYER_BASED_FIELDS) {
      const payer = String(settlement[`${fieldName} Payer`] ?? '');
      subtotal += this.utilAddConditionally(context.activeTab, payer, Number(settlement[fieldName]) || 0);
      const salesTaxField = `${fieldName} Sales Tax`;
      if (settlement[salesTaxField] !== undefined) {
        subtotal += this.utilAddConditionally(
          context.activeTab,
          payer,
          Number(settlement[salesTaxField]) || 0
        );
      }
    }

    subtotal += Number(settlement['Discount']) || 0;
    subtotal += Number(settlement['Origination Fee']) || 0;

    for (const [fieldName, fieldValue] of Object.entries(settlement)) {
      if (NET_SHEET_SKIPPED_SUBTOTAL_FIELDS.includes(fieldName)) {
        continue;
      }
      if (shouldSkipSubtotalField(fieldName)) {
        continue;
      }
      subtotal += Number(fieldValue) || 0;
    }

    tabData['Totals']['Subtotal Closing Cost'] = netSheetToFixed(subtotal);
    if (context.activeTab === 'refinance') {
      this.calculateEstimatedTotals(data, context);
      return;
    }

    this.calculateSubtotalOtherExpenses(data, context);
  }

  private calculateSubtotalOtherExpenses(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const other = tabData['Other Expenses'] ?? {};
    let subtotal = 0;

    for (const [fieldName, fieldValue] of Object.entries(other)) {
      if (shouldSkipSubtotalField(fieldName)) {
        continue;
      }
      subtotal += Number(fieldValue) || 0;
    }

    tabData['Totals'] = tabData['Totals'] ?? {};
    tabData['Totals']['Subtotal Other Expenses'] = netSheetToFixed(subtotal);
    this.calculateEstimatedTotals(data, context);
  }

  private calculateEstimatedTotals(data: NetSheetData, context: NetSheetCalcContext): void {
    if (context.activeTab === 'buyer') {
      this.calculateTotalOfBuyer(data);
      return;
    }

    if (context.activeTab === 'refinance') {
      this.calculateRefinanceCashToBorrower(data);
      return;
    }

    if (context.activeTab === 'seller' || context.activeTab === 'net2sell') {
      this.calculateEstimatedSellerProceeds(data, context);
    }
  }

  private calculateRefinanceCashToBorrower(data: NetSheetData): void {
    const tabData = this.tab(data, 'refinance');
    const totals = tabData['Totals'] ?? {};
    totals['Est Total Cash To Borrower'] = netSheetToFixed(
      Number(totals['Total New Loans Combined'] || 0) -
        netSheetSum([
          totals['Total Prepaid Items'],
          totals['Subtotal Encumbrances'],
          totals['Subtotal Closing Cost']
        ])
    );
    tabData['Totals'] = totals;
  }

  private calculateSubtotalEncumbrances(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const encumbrances = tabData['Encumbrances'] ?? {};
    tabData['Totals'] = tabData['Totals'] ?? {};
    tabData['Totals']['Subtotal Encumbrances'] = netSheetSum([
      encumbrances['First Loan'],
      encumbrances['Second Loan'],
      encumbrances['Third Loan'],
      encumbrances['Fourth Loan'],
      encumbrances['Other Loan'],
      encumbrances['Involuntary Liens']
    ]);

    if (context.activeTab === 'refinance') {
      this.calculateEstimatedTotals(data, context);
      return;
    }

    this.calculateEstimatedSellerProceeds(data, context);
  }

  private calculateBrokerageFeesValue(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    const brokerage = tabData['Brokerage Fees'] ?? {};

    brokerage['Listing Agent Commission'] = netSheetPercentOfSale(
      brokerage['Listing Agent Commission Percent'],
      salesPrice
    );
    brokerage['Processing / Marketing Fee'] = netSheetPercentOfSale(
      brokerage['Processing / Marketing Fee Percent'],
      salesPrice
    );
    brokerage['Selling Agent Commission'] = netSheetPercentOfSale(
      brokerage['Selling Agent Commission Percent'],
      salesPrice
    );
    tabData['Brokerage Fees'] = brokerage;
    this.calculateSubtotalBrokerageFees(data, context);
  }

  private calculateBrokerageFeesPercent(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;
    const brokerage = tabData['Brokerage Fees'] ?? {};

    brokerage['Listing Agent Commission Percent'] = netSheetValueToPercent(
      brokerage['Listing Agent Commission'],
      salesPrice
    );
    brokerage['Processing / Marketing Fee Percent'] = netSheetValueToPercent(
      brokerage['Processing / Marketing Fee'],
      salesPrice
    );
    brokerage['Selling Agent Commission Percent'] = netSheetValueToPercent(
      brokerage['Selling Agent Commission'],
      salesPrice
    );
    tabData['Brokerage Fees'] = brokerage;
    this.calculateSubtotalBrokerageFees(data, context);
  }

  private calculateSubtotalBrokerageFees(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const brokerage = tabData['Brokerage Fees'] ?? {};
    tabData['Totals'] = tabData['Totals'] ?? {};
    tabData['Totals']['Subtotal Brokerage Fee'] = netSheetSum([
      brokerage['Listing Agent Commission'],
      brokerage['Processing / Marketing Fee'],
      brokerage['Selling Agent Commission']
    ]);
    this.calculateEstimatedSellerProceeds(data, context);
  }

  private calculateEstimatedSellerProceeds(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const totals = tabData['Totals'] ?? {};
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;

    if (context.activeTab === 'net2sell') {
      totals['Est Total Closing Cost'] = netSheetSum([
        totals['Subtotal Closing Cost'],
        totals['Subtotal Brokerage Fee'],
        totals['Subtotal Other Expenses']
      ]);
    }

    totals['Estimated X Sum'] = netSheetSum([
      totals['Subtotal Encumbrances'],
      totals['Subtotal Closing Cost'],
      totals['Subtotal Brokerage Fee'],
      totals['Subtotal Other Expenses'],
      context.activeTab === 'net2sell' ? totals['LESS Tax Proration'] : 0
    ]);

    totals['Estimated Total Seller Proceeds'] = netSheetToFixed(
      salesPrice - Number(totals['Estimated X Sum'] || 0)
    );

    tabData['Totals'] = totals;
    this.calculateSumOfTotalFees(data, context);
  }

  private calculateSumOfTotalFees(data: NetSheetData, context: NetSheetCalcContext): void {
    const tabData = this.tab(data, context.activeTab);
    const totals = tabData['Totals'] ?? {};

    if (context.activeTab === 'seller') {
      const deductions = netSheetSum([
        totals['LESS any Seller Financing'],
        totals['LESS any Federal/State Witholding'],
        totals['LESS Tax Proration']
      ]);
      totals['Total Fees'] = netSheetToFixed(
        Number(totals['Estimated Total Seller Proceeds'] || 0) - deductions
      );
    } else if (context.activeTab === 'net2sell') {
      totals['Total Fees'] = netSheetToFixed(
        Number(totals['Estimated Total Seller Proceeds'] || 0) +
          Number(totals['Estimated X Sum'] || 0)
      );
    }

    tabData['Totals'] = totals;
  }

  getPayerValuesForTab(data: NetSheetData, tab: NetSheetTabId): Record<string, number> {
    this.syncPayerValues(data, tab);
    return { ...contextPayerValues(data, tab) };
  }

  private calculateTotalOfBuyer(data: NetSheetData): void {
    const tabData = this.tab(data, 'buyer');
    const totals = tabData['Totals'] ?? {};
    const salesPrice = Number(tabData['General Info']?.['Sales Price']) || 0;

    const totalSum = netSheetSum([
      totals['Subtotal Closing Cost'],
      totals['Total Prepaid Items'],
      totals['Subtotal Other Expenses']
    ]);

    totals['Est Cash From Buyer'] = netSheetToFixed(
      salesPrice - Number(totals['Total New Loans Combined'] || 0) + totalSum
    );
    tabData['Totals'] = totals;
  }

  private prepaidDefaults(tabData: TabRecord): void {
    const prepaid = tabData['Prepaid'] ?? {};
    prepaid['Months of Taxes'] = prepaid['Months of Taxes'] ?? 0;
    prepaid['Tax Rate'] = prepaid['Tax Rate'] ?? 0;
    prepaid['Months of Insurance'] = prepaid['Months of Insurance'] ?? 0;
    prepaid['Insurance Rate'] = prepaid['Insurance Rate'] ?? 0;
    prepaid['Days of Interest'] = prepaid['Days of Interest'] ?? 0;
    prepaid['Interest Rate'] = prepaid['Interest Rate'] ?? 0;
    tabData['Prepaid'] = prepaid;
  }

  private payerAdjustedValue(tab: NetSheetTabId, payer: string, value: number): number {
    if (tab === 'buyer') {
      if (payer === 'seller') {
        return 0;
      }
      if (payer === 'split') {
        return value / 2;
      }
      return value;
    }

    return value;
  }

  private utilAddConditionally(tab: NetSheetTabId, payer: string, value: number): number {
    if (tab === 'buyer') {
      return payer === 'seller' ? 0 : value;
    }

    return value;
  }

  private tab(data: NetSheetData, tab: NetSheetTabId): TabRecord {
    const record = (data[tab] ?? {}) as TabRecord;
    data[tab] = record;
    return record;
  }
}

function contextPayerValues(data: NetSheetData, tab: NetSheetTabId): Record<string, number> {
  const holder = data as NetSheetData & { __payerValues?: NetSheetPayerValues };
  holder.__payerValues = holder.__payerValues ?? {
    seller: {},
    net2sell: {},
    refinance: {},
    buyer: {}
  };
  return holder.__payerValues[tab];
}

function contextSet(store: Record<string, number>, field: string, value: unknown): void {
  store[field] = netSheetToFixed(value);
}
