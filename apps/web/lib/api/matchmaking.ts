import { apiClient as api } from './client';

export interface QueueDepthData {
  mode: string;
  timeControlId: string;
  stakeAmountCrowns: number;
  depth: number;
}

export const getQueueDepths = async (): Promise<QueueDepthData[]> => {
  const res: any = await api.get('/v1/matchmaking/depths');
  return res.data.depths;
};

export const joinMatchmaking = async (params: {
  mode: 'play_online' | 'competitive' | 'online_pro';
  timeControlId: string;
  stakeAmountCrowns: number;
}, guestId?: string): Promise<{ queued: boolean; queuePosition?: number }> => {
  const headers: any = {};
  if (guestId) headers['X-Guest-Id'] = guestId;
  const res: any = await api.post('/v1/matchmaking/join', params, { headers });
  return res.data;
};

export const leaveMatchmaking = async (guestId?: string): Promise<{ left: boolean; crownsReturned: number }> => {
  const headers: any = {};
  if (guestId) headers['X-Guest-Id'] = guestId;
  const res: any = await api.delete('/v1/matchmaking/leave', { headers });
  return res.data;
};

export const getMatchmakingStatus = async (): Promise<{ status: string; gameId?: string }> => {
  const res: any = await api.get('/v1/matchmaking/status');
  return res.data;
};
