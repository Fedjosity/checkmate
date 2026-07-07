export type RankTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster'
  | 'Eternal'
  | 'Crown';

export type RankDivision = 'III' | 'II' | 'I' | null;

export interface Rank {
  tier: RankTier;
  division: RankDivision;
  rp: number;
  label: string;
  icon: string;
  color: string;
  isTop500: boolean;
}

export interface RankProgress {
  current: Rank;
  rpInCurrentDivision: number;
  rpToNextDivision: number;
  isMaxRank: boolean;
}

export interface EloRecord {
  blitz: number;
  rapid: number;
  bullet: number;
  classic: number;
  gamesPlayed: number;
  blitzRP: number;
  rapidRP: number;
  bulletRP: number;
  classicRP: number;
}
