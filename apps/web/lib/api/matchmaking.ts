import { apiClient as api } from './client';

export interface QueueDepthData {
  mode: string;
  timeControl: string;
  stakeAmountCrowns: number;
  depth: number;
}

export const getQueueDepths = async (): Promise<QueueDepthData[]> => {
  const { data } = await api.get('/v1/matchmaking/depths');
  return data.data.depths;
};

export const joinMatchmaking = async (params: {
  mode: 'play_online' | 'competitive' | 'online_pro';
  timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic';
  stakeAmountCrowns: number;
}, guestId?: string): Promise<{ queued: boolean; queuePosition?: number }> => {
  const headers: any = {};
  if (guestId) headers['X-Guest-Id'] = guestId;
  const { data } = await api.post('/v1/matchmaking/join', params, { headers });
  return data.data;
};

export const leaveMatchmaking = async (guestId?: string): Promise<{ left: boolean; crownsReturned: number }> => {
  const headers: any = {};
  if (guestId) headers['X-Guest-Id'] = guestId;
  const { data } = await api.delete('/v1/matchmaking/leave', { headers });
  return data.data;
};

export const getMatchmakingStatus = async (): Promise<{ status: string; gameId?: string }> => {
  const { data } = await api.get('/v1/matchmaking/status');
  return data.data;
};
