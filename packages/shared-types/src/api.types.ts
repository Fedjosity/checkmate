export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface LeaderboardResponse {
  players: import('./user.types').LeaderboardEntry[];
  myRank: number | null;
  total: number;
}

export interface PlatformStats {
  gamesPlayed: number;
  totalPaidOutCents: number;
  activePlayers: number;
}
