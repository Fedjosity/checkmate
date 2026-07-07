export interface Wallet {
  availableBalance: number; // Crowns (integer). 100 Crowns = $1.00 USD
  stakedBalance: number;
  bonusBalance: number; // always 0 in MVP
  currency: string;
}

export interface BankAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Elo {
  blitz: number;
  rapid: number;
  bullet: number;
  classic: number;
  gamesPlayed: number;
  blitzRP: number;
  rapidRP: number;
  bulletRP: number;
  classicRP: number;
  blitzStreak: number;
  rapidStreak: number;
  bulletStreak: number;
  classicStreak: number;
  isTop500: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  country: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'failed';
  wallet: Wallet;
  elo: Elo;
  bankAccount: BankAccount | null;
  createdAt: string;
}

export interface PublicUser {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  country: string;
  elo: Elo;
}

export interface LeaderboardEntry extends PublicUser {
  rank: number;
}

