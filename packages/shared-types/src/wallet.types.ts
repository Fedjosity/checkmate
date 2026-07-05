// ─── Crown Bundles ───

export interface CrownBundle {
  id: string;
  crowns: number;
  priceUSD: number;
  priceWithFeeUSD: number;
  popular?: boolean;
}

export const CROWN_BUNDLES: CrownBundle[] = [
  { id: 'bundle_500', crowns: 500, priceUSD: 5, priceWithFeeUSD: 5.1 },
  { id: 'bundle_1000', crowns: 1000, priceUSD: 10, priceWithFeeUSD: 10.2, popular: true },
  { id: 'bundle_2500', crowns: 2500, priceUSD: 25, priceWithFeeUSD: 25.5 },
  { id: 'bundle_5000', crowns: 5000, priceUSD: 50, priceWithFeeUSD: 51.0 },
  { id: 'bundle_10000', crowns: 10000, priceUSD: 100, priceWithFeeUSD: 102.0 },
];

// Custom bundle: crowns = Math.floor(userEnteredUSD / 1.02 * 100), min $1 USD input

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
