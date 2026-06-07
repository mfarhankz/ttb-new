/** Filter-by options — mirrors legacy pipeline columns for purchase-billing. */
export interface PurchaseHistoryFilterFieldOption {
  value: string;
  label: string;
}

export const PURCHASE_HISTORY_FILTER_FIELD_OPTIONS: PurchaseHistoryFilterFieldOption[] = [
  { value: '$', label: 'All fields' },
  { value: 'purchaseId', label: 'Purchase ID' },
  { value: 'product', label: 'Product' },
  { value: 'orderPlaced', label: 'Order Placed' },
  { value: 'price', label: 'Price' },
  { value: 'status', label: 'Status' },
  { value: 'paymentMethod', label: 'Payment Method' }
];
