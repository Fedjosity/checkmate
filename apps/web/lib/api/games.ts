import { apiClient as api } from './client';
import { Rank } from '@checkmate/shared-types';

export interface GameInfo {
  id: string;
  whiteUid: string;
  blackUid: string;
  mode: string;
  timeControl: string;
  status: string;
  result: string | null;
  createdAt: { _seconds: number; _nanoseconds: number };
}

export const createBotGame = async (difficulty: string, timeControlId: string, playerColor: string = 'random') => {
  const { data } = await api.post('/games/bot', { difficulty, timeControlId, playerColor });
  return data.data; // { gameId: string }
};

export const createPlayOnlineGame = async (timeControlId: string, guestId?: string) => {
  const headers: any = {};
  if (guestId) {
    headers['X-Guest-Id'] = guestId;
  }
  const { data } = await api.post('/games/online', { timeControlId }, { headers });
  return data.data; // { queued: true }
};

export const getGame = async (gameId: string, guestId?: string) => {
  const headers: any = {};
  if (guestId) {
    headers['X-Guest-Id'] = guestId;
  }
  const { data } = await api.get(`/games/${gameId}`, { headers });
  return data.data.game;
};

export const getGameHistory = async (page: number = 1, limit: number = 20) => {
  const { data } = await api.get(`/games/history?page=${page}&limit=${limit}`);
  return data.data; // { games: GameInfo[], total: number, page: number }
};
