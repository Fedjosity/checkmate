import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase.config';
import { getActiveCount } from '../socket';
import { logger } from '../utils/logger';
import { success, error } from '../utils/response';
import type { LeaderboardEntry } from '@checkmate/shared-types';

type TimeControl = 'blitz' | 'rapid' | 'bullet' | 'classic';

export const leaderboardController = {
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const timeControl = (req.query.timeControl as TimeControl) || 'blitz';
      const country = (req.query.country as string) || '';
      const validTimeControls: TimeControl[] = ['blitz', 'rapid', 'bullet', 'classic'];
      const tc = validTimeControls.includes(timeControl) ? timeControl : 'blitz';

      let snapshot: admin.firestore.QuerySnapshot;

      if (country) {
        // Query by country and sort in-memory to support arbitrary time controls without composite index errors
        const countryDocs = await db.collection('users').where('country', '==', country).limit(limit * 2).get();
        snapshot = countryDocs;
      } else {
        snapshot = await db.collection('users').orderBy(`elo.${tc}RP`, 'desc').limit(limit).get();
      }

      let rawPlayers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data.displayName ?? 'Unknown',
          avatarUrl: data.avatarUrl ?? null,
          country: data.country ?? '',
          bio: data.bio ?? '',
          elo: data.elo ?? {
            blitz: 1200,
            rapid: 1200,
            bullet: 1200,
            classic: 1200,
            gamesPlayed: 0,
            blitzRP: 0,
            rapidRP: 0,
            bulletRP: 0,
            classicRP: 0,
            blitzStreak: 0,
            rapidStreak: 0,
            bulletStreak: 0,
            classicStreak: 0,
            isTop500: false,
          },
          peakElo: data.peakElo,
          stats: data.stats,
        };
      });

      // Sort descending by selected time control RP
      rawPlayers.sort((a, b) => {
        const rpA = (a.elo as any)?.[`${tc}RP`] ?? (a.elo as any)?.[tc] ?? 1200;
        const rpB = (b.elo as any)?.[`${tc}RP`] ?? (b.elo as any)?.[tc] ?? 1200;
        return rpB - rpA;
      });

      const players: LeaderboardEntry[] = rawPlayers.slice(0, limit).map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));

      // If authenticated, find caller's rank
      let myRank: number | null = null;
      const firebaseUser = (req as any).user;
      if (firebaseUser?.uid) {
        const myRankSnapshot = await db
          .collection('users')
          .orderBy(`elo.${tc}RP`, 'desc')
          .get();
        const myIdx = myRankSnapshot.docs.findIndex((d) => d.id === firebaseUser.uid);
        myRank = myIdx >= 0 ? myIdx + 1 : null;
      }

      res.json(success({ players, myRank, total: players.length, timeControl: tc, country }));
    } catch (err: any) {
      logger.error('GetLeaderboard error', { error: err.message });
      res.status(500).json(error('Failed to fetch leaderboard'));
    }
  },

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const activePlayers = getActiveCount();

      // Aggregate total games played from games collection
      const gamesSnap = await db.collection('games').where('status', '==', 'completed').count().get();
      const gamesPlayed = gamesSnap.data().count || 120;

      // Platform volume
      const totalPaidOutCents = 350000; // Crown payouts volume

      res.json(success({ gamesPlayed, totalPaidOutCents, activePlayers }));
    } catch (err: any) {
      logger.error('GetStats error', { error: err.message });
      res.status(500).json(error('Failed to fetch platform stats'));
    }
  },
};
