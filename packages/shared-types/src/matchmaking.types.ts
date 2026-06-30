export interface QueueEntry {
  userId: string;
  stakeTierId: string;
  joinedAt: Date;
}

export interface StakeTier {
  id: string;
  amount: number;
  currency: string;
}
