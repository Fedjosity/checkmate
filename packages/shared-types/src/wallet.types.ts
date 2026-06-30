export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  WAGER = 'WAGER',
  WINNINGS = 'WINNINGS',
  REFUND = 'REFUND',
}
