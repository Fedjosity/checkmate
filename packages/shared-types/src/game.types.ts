export interface Game {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  status: GameStatus;
  timeControl: TimeControl;
  pgn: string;
  fen: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Move {
  san: string;
  from: string;
  to: string;
  piece: string;
  color: string;
}

export enum GameStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TimeControl {
  initial: number; // in seconds
  increment: number; // in seconds
}

export interface GameArchiveEntry {
  id: string;
  opponent: {
    uid: string;
    displayName: string;
    avatarUrl: string | null;
    country: string;
    elo: number;
  };
  userColor: 'white' | 'black';
  result: 'win' | 'loss' | 'draw';
  resultReason: string;
  timeControlCategory: string;
  timeControlId: string;
  stakeAmountCrowns: number;
  netCrownsWon: number;
  movesCount: number;
  pgn: string;
  fen: string;
  completedAt: string;
}
