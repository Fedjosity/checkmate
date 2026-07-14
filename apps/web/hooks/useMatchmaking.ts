import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSocket } from '../lib/socket/client';
import { joinMatchmaking, leaveMatchmaking } from '../lib/api/matchmaking';
import { createGuestSession } from '../lib/api/auth';
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
    mode: 'play_online' | 'competitive' | 'online_pro',
    timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic',
    stakeAmountCrowns: number
  ) => {
    try {
      setState('searching'); // optimistic
      let guestId = undefined;

      if (!user) {
        if (mode !== 'play_online') {
          throw new Error('You must be logged in to play this mode.');
        }
        
        // Check local storage for existing guest session
        const existingGuest = localStorage.getItem('checkmate_guest');
        if (existingGuest) {
          const guestData = JSON.parse(existingGuest);
          if (new Date(guestData.expiresAt) > new Date()) {
            guestId = guestData.guestId;
          }
        }

        if (!guestId) {
          const newGuest = await createGuestSession();
          guestId = newGuest.guestId;
          localStorage.setItem('checkmate_guest', JSON.stringify(newGuest));
        }
      }

      await joinMatchmaking({ mode, timeControl, stakeAmountCrowns }, guestId);
      
      const socket = getSocket();
      socket.emit('matchmaking:join', { uid: guestId || user?.uid }); // Backend uses handshake uid or session, but we can pass it here too
    } catch (error: any) {
      setState('idle');
      toast.error(error.message || error.response?.data?.error || 'Failed to join queue');
    }
  }, [user]);

  const leaveQueue = useCallback(async () => {
    try {
      let guestId = undefined;
      if (!user) {
        const existingGuest = localStorage.getItem('checkmate_guest');
        if (existingGuest) {
          guestId = JSON.parse(existingGuest).guestId;
        }
      }
      
      await leaveMatchmaking(guestId);
      
      const socket = getSocket();
      socket.emit('matchmaking:leave', { uid: guestId || user?.uid });
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
