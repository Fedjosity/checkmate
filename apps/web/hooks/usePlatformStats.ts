import { useQuery } from '@tanstack/react-query';
import { getPlatformStats } from '@/lib/api/leaderboard';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: getPlatformStats,
    refetchInterval: 15_000,
  });
}
