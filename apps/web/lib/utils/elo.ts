interface EloTier {
  label: string;
  piece: string;
  color: string;
}

export function getEloTier(elo: number): EloTier {
  if (elo < 1000) return { label: 'Beginner',          piece: '♙', color: '#9CA3AF' };
  if (elo < 1200) return { label: 'Club Player',        piece: '♘', color: '#C9A84C' };
  if (elo < 1500) return { label: 'Advanced',           piece: '♗', color: '#C9A84C' };
  if (elo < 1800) return { label: 'Expert',             piece: '♖', color: '#C9A84C' };
  if (elo < 2000) return { label: 'Candidate Master',   piece: '♕', color: '#C9A84C' };
  return            { label: 'Master',                 piece: '♔', color: '#F59E0B' };
}
