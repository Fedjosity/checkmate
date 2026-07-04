import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/lib/api/leaderboard';

export function useMiniLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard', 'mini'],
    queryFn: () => getLeaderboard({ limit: 3, timeControl: 'blitz', period: 'alltime' }),
    staleTime: 60_000,
  });
}
