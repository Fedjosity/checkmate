import { apiClient } from './client';
import type { LeaderboardEntry, PlatformStats } from '@checkmate/shared-types';

export interface LeaderboardResponseData {
  players: LeaderboardEntry[];
  myRank: number | null;
  total: number;
  timeControl: string;
  country?: string;
}

export const getLeaderboard = (params?: {
  limit?: number;
  timeControl?: 'blitz' | 'rapid' | 'bullet' | 'classic';
  country?: string;
}) => apiClient.get<{ data: LeaderboardResponseData }>('/v1/leaderboard', { params });

export const getPlatformStats = () =>
  apiClient.get<{ data: PlatformStats }>('/v1/leaderboard/stats');
