export interface Wallet {
  availableBalance: number; // USD cents
  stakedBalance: number;
  bonusBalance: number;
  currency: string;
}

export interface Elo {
  blitz: number;
  rapid: number;
  bullet: number;
  classic: number;
  gamesPlayed: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  country: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  wallet: Wallet;
  elo: Elo;
  createdAt: string;
}
