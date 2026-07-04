import { apiClient } from './client';
import type { LeaderboardResponse, PlatformStats } from '@checkmate/shared-types';

export const getLeaderboard = (params?: {
  limit?: number;
  timeControl?: 'blitz' | 'rapid' | 'bullet' | 'classic';
  period?: 'week' | 'month' | 'alltime';
}) => apiClient.get<LeaderboardResponse>('/v1/leaderboard', { params });

export const getPlatformStats = () =>
  apiClient.get<{ data: PlatformStats }>('/v1/leaderboard/stats');
