export interface User {
  id: string;
  username: string;
  email: string;
  walletId: string;
  kycTier: KYCTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export enum KYCTier {
  NONE = 'NONE',
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
}
