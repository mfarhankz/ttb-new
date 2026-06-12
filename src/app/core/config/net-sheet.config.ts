import { NetSheetTabId } from '../interfaces/net-sheet.interface';

export const NET_SHEET_TABS: NetSheetTabId[] = ['seller', 'net2sell', 'refinance', 'buyer'];

export const NET_SHEET_TAB_LABELS: Record<NetSheetTabId, string> = {
  seller: 'Seller',
  net2sell: 'Net to Sell',
  refinance: 'Refinance',
  buyer: 'Buyer'
};

export const NET_SHEET_LOAN_TYPES = [
  { value: 'CONVENTIONAL', label: 'Conventional' },
  { value: 'FHA', label: 'FHA' },
  { value: 'VA', label: 'VA' },
  { value: 'ALL_CASH', label: 'All Cash' }
] as const;

export const NET_SHEET_PAYER_CHOICES = [
  { value: 'seller', label: 'Seller' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'split', label: 'Split' }
] as const;

/** Legacy payerChoicesRefinance — refinance closing costs use Full Fee only. */
export const NET_SHEET_REFINANCE_PAYER_CHOICES = [{ value: '', label: 'Full Fee' }] as const;

export const NET_SHEET_PAYER_BASED_FIELDS = [
  'Escrow Fee',
  'Title Insurance Policy',
  'Lenders Title Policy'
] as const;

export const NET_SHEET_DEFAULT_LABELS: Record<string, string> = {
  'Current Total Monthly HOA': 'Current Monthly HOA Fees',
  'Security Deposits / Rental Income': 'Rental Deposits',
  'Appraisal Fee': 'Appraisal',
  'Wood Destroying Pest / Other Inspection': 'Pest Inspection',
  'HOA Transfer Fees / Docs': 'HOA Transfer Fee / Docs',
  'Title Insurance Policy': 'Owner Title Policy',
  'Listing Agent Commission': 'Listing Agent',
  'Selling Agent Commission': 'Selling Agent',
  'PMI Percent': 'Monthly PMI',
  'Estimate Monthly Payment': 'Est. Monthly Payment',
  'Months of Insurance': 'Months of Insur.',
  'Sales Price': 'Estimated Appraised Value'
};

export const NET_SHEET_SKIPPED_SUBTOTAL_FIELDS = [
  'Escrow Fee Percent',
  'Escrow Fee Sales Tax',
  'Escrow Fee',
  'Title Insurance Policy Sales Tax',
  'Title Insurance Policy',
  'Lenders Title Policy Sales Tax',
  'Lenders Title Policy',
  'Discount Percent',
  'Discount',
  'Origination Fee Percent',
  'Origination Fee',
  'County Transfer Tax Percent',
  'City Transfer Tax Percent'
];

export const BUYER_WORKSHEET_GROUPS = [
  'General Info',
  'Settlement Services',
  'Other Expenses',
  'New Loan',
  'Encumbrances',
  'Prepaid',
  'Payment',
  'Totals'
] as const;

export interface NetSheetWorksheetSection {
  title: string;
  groupName: string;
  column: 'left' | 'right';
  row: number;
  subtotalField?: string;
}

/** Legacy seller / net-to-sell two-column worksheet layout. */
export const SELLER_WORKSHEET_SECTIONS: NetSheetWorksheetSection[] = [
  { title: 'General Information', groupName: 'General Info', column: 'left', row: 1 },
  { title: 'Encumbrances', groupName: 'Encumbrances', column: 'right', row: 1, subtotalField: 'Subtotal Encumbrances' },
  { title: 'Closing Costs', groupName: 'Settlement Services', column: 'left', row: 2, subtotalField: 'Subtotal Closing Cost' },
  { title: 'Other Costs', groupName: 'Other Expenses', column: 'right', row: 2, subtotalField: 'Subtotal Other Expenses' },
  { title: 'Brokerage Fees', groupName: 'Brokerage Fees', column: 'left', row: 3, subtotalField: 'Subtotal Brokerage Fee' },
  { title: 'Total', groupName: 'Totals', column: 'right', row: 3 }
];

/** Legacy refinance tab — left: General Info + Closing Costs; right: Encumbrances through Total. */
export const REFINANCE_WORKSHEET_SECTIONS: NetSheetWorksheetSection[] = [
  { title: 'General Information', groupName: 'General Info', column: 'left', row: 1 },
  { title: 'Closing Costs', groupName: 'Settlement Services', column: 'left', row: 2, subtotalField: 'Subtotal Closing Cost' },
  { title: 'Encumbrances', groupName: 'Encumbrances', column: 'right', row: 1, subtotalField: 'Subtotal Encumbrances' },
  { title: 'New Loan', groupName: 'New Loan', column: 'right', row: 2, subtotalField: 'Total New Loans Combined' },
  { title: 'Payment', groupName: 'Payment', column: 'right', row: 3, subtotalField: 'Estimate Monthly Payment' },
  { title: 'Prepaids', groupName: 'Prepaid', column: 'right', row: 4, subtotalField: 'Total Prepaid Items' },
  { title: 'Total', groupName: 'Totals', column: 'right', row: 5 }
];

export const REFINANCE_NEW_LOAN_AMOUNT_FIELDS = ['First Loan', 'Second Loan'] as const;

export const REFINANCE_NEW_LOAN_PERCENT_FIELDS: Record<string, string> = {
  'First Loan': 'First Loan Percent',
  'Second Loan': 'Second Loan Percent'
};

export const REFINANCE_NEW_LOAN_FIELDS = [
  'First Loan',
  'First Loan Interest Rate',
  'First Loan Terms in Years',
  'Second Loan',
  'Second Loan Interest Rate',
  'Second Loan Terms in Years'
] as const;

export const REFINANCE_PAYMENT_FIELDS = [
  'Principal & Interest',
  'Property Taxes',
  'Homeowner Insurance',
  'PMI Percent',
  'P&I 2nd Loan',
  'HOA',
  'Other'
] as const;

export const REFINANCE_PREPAID_FIELDS = [
  'Months of Taxes',
  'Tax Rate',
  'Amount of Taxes for x Months',
  'Months of Insurance',
  'Insurance Rate',
  'Amount of Insurance for x Months',
  'Days of Interest',
  'Interest Rate',
  'Amount of Interest for x Days'
] as const;

export const REFINANCE_SETTLEMENT_STANDARD_FIELDS = [
  'Recording Fees',
  'Notary',
  'Reconveyance Fee',
  'Courier Fee',
  'Credit Report',
  'Prepayment Penalty Fee',
  'Credit Card Payoff(s)',
  'Additional Payoffs',
  'Processing Fee',
  'Doc Fee',
  'Underwriting Fee',
  'Other 1',
  'Other 2'
] as const;

export const REFINANCE_SETTLEMENT_PAIR_FIELDS = ['Origination Fee', 'Discount'] as const;

export const REFINANCE_TOTALS_FIELDS = ['Est Total Cash To Borrower'] as const;

export const NET_SHEET_BROKERAGE_AMOUNT_FIELDS = [
  'Listing Agent Commission',
  'Processing / Marketing Fee',
  'Selling Agent Commission'
] as const;

export const NET_SHEET_BROKERAGE_PERCENT_FIELDS: Record<string, string> = {
  'Listing Agent Commission': 'Listing Agent Commission Percent',
  'Processing / Marketing Fee': 'Processing / Marketing Fee Percent',
  'Selling Agent Commission': 'Selling Agent Commission Percent'
};

export const NET_SHEET_DISPLAY_ONLY_TOTAL_FIELDS = new Set([
  'Subtotal Encumbrances',
  'Subtotal Closing Cost',
  'Subtotal Other Expenses',
  'Subtotal Brokerage Fee',
  'Subtotal Settlement Services',
  'Estimated Total Seller Proceeds',
  'Est. Subtotal Seller Proceeds',
  'Est. Total Cash Proceeds',
  'Total Fees',
  'Total New Loans Combined',
  'Est Total Closing Cost',
  'Total Prepaid Items',
  'Estimate Monthly Payment',
  'Est Total Cash To Borrower'
]);

/** Legacy net2sell General Information — Sales Price is solved, not edited here. */
export const NET2SELL_GENERAL_INFO_FIELDS = [
  'Net Goal For Seller',
  'Estimated Closing Date',
  'Property Tax Prorated Date',
  'Current Annual Taxes',
  'Current Total Monthly HOA',
  'Security Deposits / Rental Income'
] as const;

/** Legacy net2sell Total section display order. */
export const NET2SELL_TOTALS_DISPLAY_FIELDS = [
  'Est Total Closing Cost',
  'Subtotal Encumbrances',
  'LESS Tax Proration',
  'Estimated Total Seller Proceeds'
] as const;

export const NET2SELL_TOTAL_FIELD_LABELS: Record<string, string> = {
  'Est Total Closing Cost': 'Est. Total Closing Cost',
  'Subtotal Encumbrances': 'Est. Encumbrances',
  'Estimated Total Seller Proceeds': 'Net at Closing'
};

export const NET_SHEET_INTERNAL_TOTAL_FIELDS = new Set(['Estimated X Sum']);

/** Internal API fields — never shown in the worksheet UI. */
export const NET_SHEET_HIDDEN_FIELDS = new Set([
  'SA_PROPERTY_ID',
  'Property Address',
  'Property State Fips',
  'Property County Fips',
  'Property City',
  'Property Zip',
  'netsheet_id',
  'time_saved',
  'Current Monthly Rent'
]);

export const SELLER_GENERAL_INFO_FIELDS = [
  'Sales Price',
  'Estimated Closing Date',
  'Property Tax Prorated Date',
  'Current Annual Taxes',
  'Current Total Monthly HOA',
  'Security Deposits / Rental Income'
] as const;

export const REFINANCE_GENERAL_INFO_FIELDS = [...SELLER_GENERAL_INFO_FIELDS] as const;

export const SELLER_ENCUMBRANCE_FIELDS = [
  'First Loan',
  'Second Loan',
  'Third Loan',
  'Fourth Loan'
] as const;

export const SELLER_TOTALS_FIELDS = [
  'Estimated Total Seller Proceeds',
  'LESS any Seller Financing',
  'LESS any Federal/State Witholding',
  'LESS Tax Proration',
  'Total Fees'
] as const;

export const NET_SHEET_SETTLEMENT_STANDARD_FIELDS = [
  'Notary',
  'Recording Fees',
  'Deed Drawing',
  'County Transfer Tax',
  'City Transfer Tax',
  'Other Transfer Fee',
  'Reconveyance Fee'
] as const;

export const NET_SHEET_OTHER_EXPENSE_FIELDS = [
  'County Transfer Tax',
  'Appraisal Fee',
  'Natural Hazard / Reports',
  'Wood Destroying Pest / Other Inspection',
  'Home Warranty',
  'Buyers Closing Costs',
  'Estimated Repairs',
  'Prepayment Penalty Fee',
  'Courier Fee',
  'HOA Transfer Fees / Docs',
  'Other 1',
  'Other 2',
  'Other 3',
  'Other 4'
] as const;

export const NET_SHEET_TOTAL_FIELD_LABELS: Record<string, string> = {
  'Estimated Total Seller Proceeds': 'Est. Subtotal Seller Proceeds',
  'Total Fees': 'Est. Total Cash Proceeds'
};

export const NET_SHEET_FEE_DEBOUNCE_MS = 800;
