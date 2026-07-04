import { Request, Response } from 'express';
import { db } from '../config/firebase.config';
import { getActiveCount } from '../socket';
import { logger } from '../utils/logger';
import { success, error } from '../utils/response';
import type { LeaderboardEntry } from '@checkmate/shared-types';

type TimeControl = 'blitz' | 'rapid' | 'bullet' | 'classic';

export const leaderboardController = {
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const timeControl = (req.query.timeControl as TimeControl) || 'blitz';
      const validTimeControls: TimeControl[] = ['blitz', 'rapid', 'bullet', 'classic'];
      const tc = validTimeControls.includes(timeControl) ? timeControl : 'blitz';

      const snapshot = await db
        .collection('users')
        .orderBy(`elo.${tc}`, 'desc')
        .limit(limit)
        .get();

      const players: LeaderboardEntry[] = snapshot.docs.map((doc, idx) => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data.displayName ?? 'Unknown',
          avatarUrl: data.avatarUrl ?? null,
          country: data.country ?? '',
          elo: data.elo ?? { blitz: 1200, rapid: 1200, bullet: 1200, classic: 1200, gamesPlayed: 0 },
          rank: idx + 1,
        };
      });

      // If authenticated, find caller's rank
      let myRank: number | null = null;
      const firebaseUser = (req as any).user;
      if (firebaseUser?.uid) {
        const myRankSnapshot = await db
          .collection('users')
          .orderBy(`elo.${tc}`, 'desc')
          .get();
        const myIdx = myRankSnapshot.docs.findIndex((d) => d.id === firebaseUser.uid);
        myRank = myIdx >= 0 ? myIdx + 1 : null;
      }

      res.json(success({ players, myRank, total: players.length }));
    } catch (err: any) {
      logger.error('GetLeaderboard error', { error: err.message });
      res.status(500).json(error('Failed to fetch leaderboard'));
    }
  },

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const activePlayers = getActiveCount();

      // TODO: Connect gamesPlayed to real Firestore aggregation once game data is available
      const gamesPlayed = 1247;

      // TODO: Connect totalPaidOutCents to real Firestore aggregation once payout data is available
      const totalPaidOutCents = 284500; // = $2,845.00

      res.json(success({ gamesPlayed, totalPaidOutCents, activePlayers }));
    } catch (err: any) {
      logger.error('GetStats error', { error: err.message });
      res.status(500).json(error('Failed to fetch platform stats'));
    }
  },
};
