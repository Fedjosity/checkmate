// ─── Crown Bundles ───

export interface CrownBundle {
  id: string;
  crowns: number;
  priceUSD: number;
  priceWithFeeUSD: number;
  popular?: boolean;
}

export const DEFAULT_CROWN_PURCHASE_FEE_PERCENT = 2;
export const DEFAULT_WITHDRAWAL_FEE_PERCENT = 8;

export const CROWN_BUNDLES: CrownBundle[] = [
  { id: 'bundle_100', crowns: 100, priceUSD: 1, priceWithFeeUSD: 1.02 },
  { id: 'bundle_500', crowns: 500, priceUSD: 5, priceWithFeeUSD: 5.10 },
  { id: 'bundle_1000', crowns: 1000, priceUSD: 10, priceWithFeeUSD: 10.20, popular: true },
  { id: 'bundle_2500', crowns: 2500, priceUSD: 25, priceWithFeeUSD: 25.50 },
  { id: 'bundle_5000', crowns: 5000, priceUSD: 50, priceWithFeeUSD: 51.00 },
  { id: 'bundle_10000', crowns: 10000, priceUSD: 100, priceWithFeeUSD: 102.00 },
];

// Custom bundle: crowns = Math.floor(userEnteredUSD / (1 + DEFAULT_CROWN_PURCHASE_FEE_PERCENT / 100) * 100), min $1 USD input

// ─── Transactions ───

export type TransactionType =
  | 'crown_purchase'
  | 'withdrawal'
  | 'match_entry'
  | 'match_win'
  | 'refund';

export type TransactionStatus = 'pending' | 'complete' | 'failed';

export interface Transaction {
  id: string;
  uid: string;
  type: TransactionType;
  crownsAmount: number;
  usdAmount: number; // in cents
  status: TransactionStatus;
  provider: 'flutterwave' | 'internal';
  providerRef: string | null;
  description: string;
  createdAt: string;
  completedAt: string | null;
}
