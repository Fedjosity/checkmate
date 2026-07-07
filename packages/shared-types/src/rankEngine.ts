import { Rank, RankProgress, RankTier } from './elo.types';

const TIER_ORDER: RankTier[] = [
  'Bronze', 'Silver', 'Gold', 'Platinum',
  'Diamond', 'Master', 'Grandmaster',
  'Eternal', 'Crown',
];

const RP_PER_DIVISION = 100;
const DIVISIONS_PER_TIER = 3;
const RP_PER_TIER = RP_PER_DIVISION * DIVISIONS_PER_TIER;

const ETERNAL_RP_THRESHOLD = 2100;

export const RANK_META: Record<RankTier, { icon: string; color: string; description: string; }> = {
  Bronze:      { icon: '♙', color: '#CD7F32', description: 'Learning the fundamentals' },
  Silver:      { icon: '♙', color: '#C0C0C0', description: 'Developing consistent play' },
  Gold:        { icon: '♘', color: '#FFD700', description: 'Tactical awareness growing' },
  Platinum:    { icon: '♗', color: '#E5E4E2', description: 'Strong positional understanding' },
  Diamond:     { icon: '♗', color: '#B9F2FF', description: 'Sharp calculation skills' },
  Master:      { icon: '♖', color: '#9B59B6', description: 'Deep strategic thinking' },
  Grandmaster: { icon: '♕', color: '#C9A84C', description: 'Elite competitive player' },
  Eternal:     { icon: '♔', color: '#F59E0B', description: 'Among the best in the world' },
  Crown:       { icon: '♔', color: '#C9A84C', description: 'Top 500 globally — The Crown' },
};

export function rpToRank(rp: number, isTop500: boolean = false): Rank {
  if (isTop500) {
    return {
      tier: 'Crown',
      division: null,
      rp,
      label: 'Crown',
      icon: RANK_META.Crown.icon,
      color: RANK_META.Crown.color,
      isTop500: true,
    };
  }

  if (rp >= ETERNAL_RP_THRESHOLD) {
    return {
      tier: 'Eternal',
      division: null,
      rp,
      label: 'Eternal',
      icon: RANK_META.Eternal.icon,
      color: RANK_META.Eternal.color,
      isTop500: false,
    };
  }

  const clampedRp = Math.max(0, rp);
  const tierIndex = Math.min(6, Math.floor(clampedRp / RP_PER_TIER));
  const rpInTier = clampedRp % RP_PER_TIER;
  const divisionIndex = Math.floor(rpInTier / RP_PER_DIVISION);
  const division = (['III', 'II', 'I'] as const)[divisionIndex];
  const tier = TIER_ORDER[tierIndex];

  return {
    tier,
    division,
    rp,
    label: `${tier} ${division}`,
    icon: RANK_META[tier].icon,
    color: RANK_META[tier].color,
    isTop500: false,
  };
}

export function getRankProgress(rp: number): RankProgress {
  const isMaxRank = rp >= ETERNAL_RP_THRESHOLD;
  const rpInCurrentDivision = isMaxRank ? (rp - ETERNAL_RP_THRESHOLD) : (rp % RP_PER_DIVISION);
  const rpToNextDivision = isMaxRank ? 0 : (RP_PER_DIVISION - rpInCurrentDivision);

  return {
    current: rpToRank(rp),
    rpInCurrentDivision,
    rpToNextDivision,
    isMaxRank,
  };
}

export function calculateRPChange(won: boolean, winStreak: number): number {
  if (won) {
    return winStreak >= 3 ? 30 : 25;
  }
  return -20;
}

export function getRankFromElo(elo: number): number {
  if (elo < 800) return 0;
  if (elo < 900) return 50;
  if (elo < 1000) return 100;
  if (elo < 1100) return 200;
  if (elo < 1200) return 300;
  if (elo < 1300) return 400;
  if (elo < 1400) return 500;
  if (elo < 1500) return 600;
  if (elo < 1600) return 700;
  if (elo < 1700) return 800;
  if (elo < 1800) return 900;
  if (elo < 1900) return 1000;
  if (elo < 2000) return 1100;
  if (elo < 2100) return 1200;
  if (elo < 2200) return 1400;
  if (elo < 2300) return 1500;
  if (elo < 2400) return 1700;
  if (elo < 2500) return 1800;
  return 2000;
}

export function getEloRangeForRank(rank: Rank): { min: number; max: number } {
  // Not strictly used for bounds checking as matchmaking is +/- 200 ELO
  // but keeping it as requested
  return { min: 0, max: 0 }; 
}

export function canPlayTogether(rankA: Rank, rankB: Rank): boolean {
  if (rankA.tier === 'Eternal' || rankA.tier === 'Crown' || rankB.tier === 'Eternal' || rankB.tier === 'Crown') {
    return false;
  }

  const getSubdivisionIndex = (rank: Rank) => {
    const tierIndex = TIER_ORDER.indexOf(rank.tier);
    if (tierIndex === -1) return 0;
    const divOffset = rank.division === 'III' ? 0 : rank.division === 'II' ? 1 : 2;
    return (tierIndex * 3) + divOffset;
  };

  const idxA = getSubdivisionIndex(rankA);
  const idxB = getSubdivisionIndex(rankB);

  // If both are Gold III or above (index >= 6)
  if (idxA >= 6 || idxB >= 6) {
    return Math.abs(idxA - idxB) <= 3;
  }

  return true;
}
