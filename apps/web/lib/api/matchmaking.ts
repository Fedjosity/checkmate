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
  mode: 'friendly' | 'competitive' | 'paid';
  timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic';
  stakeAmountCrowns: number;
}): Promise<{ queued: boolean; queuePosition?: number }> => {
  const { data } = await api.post('/v1/matchmaking/join', params);
  return data.data;
};

export const leaveMatchmaking = async (): Promise<{ left: boolean; crownsReturned: number }> => {
  const { data } = await api.delete('/v1/matchmaking/leave');
  return data.data;
};

export const getMatchmakingStatus = async (): Promise<{ status: string; gameId?: string }> => {
  const { data } = await api.get('/v1/matchmaking/status');
  return data.data;
};
