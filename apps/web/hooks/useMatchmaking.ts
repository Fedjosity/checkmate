import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSocket } from '../lib/socket/client';
import { joinMatchmaking, leaveMatchmaking } from '../lib/api/matchmaking';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Rank } from '@checkmate/shared-types';

export type MatchmakingState = 'idle' | 'searching' | 'match_found' | 'timeout';

export interface MatchData {
  gameId: string;
  opponentName: string;
  opponentElo: number;
  opponentRank: Rank;
  youAre: 'white' | 'black';
}

export const useMatchmaking = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [state, setState] = useState<MatchmakingState>('idle');
  const [matchData, setMatchData] = useState<MatchData | null>(null);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const onJoined = () => setState('searching');
    const onLeft = () => setState('idle');
    const onMatchFound = (data: MatchData) => {
      setState('match_found');
      setMatchData(data);
      // Automatically redirect after 3 seconds
      setTimeout(() => {
        router.push(`/game/${data.gameId}`);
      }, 3000);
    };
    const onTimeout = (data: { message: string }) => {
      setState('timeout');
      toast.error(data.message);
    };

    socket.on('matchmaking:joined', onJoined);
    socket.on('matchmaking:left', onLeft);
    socket.on('matchmaking:match_found', onMatchFound);
    socket.on('matchmaking:timeout', onTimeout);

    return () => {
      socket.off('matchmaking:joined', onJoined);
      socket.off('matchmaking:left', onLeft);
      socket.off('matchmaking:match_found', onMatchFound);
      socket.off('matchmaking:timeout', onTimeout);
    };
  }, [user, router]);

  const joinQueue = useCallback(async (
    mode: 'friendly' | 'competitive' | 'paid',
    timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic',
    stakeAmountCrowns: number
  ) => {
    if (!user) return;
    try {
      setState('searching'); // optimistic
      await joinMatchmaking({ mode, timeControl, stakeAmountCrowns });
      
      const socket = getSocket();
      socket.emit('matchmaking:join', { uid: user.uid });
    } catch (error: any) {
      setState('idle');
      toast.error(error.response?.data?.error || 'Failed to join queue');
    }
  }, [user]);

  const leaveQueue = useCallback(async () => {
    if (!user) return;
    try {
      await leaveMatchmaking();
      
      const socket = getSocket();
      socket.emit('matchmaking:leave', { uid: user.uid });
      setState('idle');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to leave queue');
    }
  }, [user]);

  const resetState = useCallback(() => {
    setState('idle');
    setMatchData(null);
  }, []);

  return {
    state,
    matchData,
    joinQueue,
    leaveQueue,
    resetState,
  };
};
