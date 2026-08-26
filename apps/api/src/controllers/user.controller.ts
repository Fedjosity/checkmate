import { Request, Response } from 'express';
import { db, bucket } from '../config/firebase.config';
import { logger } from '../utils/logger';
import { success, error } from '../utils/response';
import type { PublicUser, GameArchiveEntry, HeadToHeadStats } from '@checkmate/shared-types';

export const userController = {
  // ─── GET /v1/users/:uid ─────────────────────────────────────
  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      const doc = await db.collection('users').doc(uid).get();

      if (!doc.exists) {
        res.status(404).json(error('User not found'));
        return;
      }

      const data = doc.data()!;
      const publicProfile: PublicUser = {
        uid,
        displayName: data.displayName || 'Player',
        avatarUrl: data.avatarUrl || null,
        country: data.country || '',
        bio: data.bio || '',
        elo: data.elo || {
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
        peakElo: data.peakElo || {
          blitz: data.elo?.blitz || 1200,
          rapid: data.elo?.rapid || 1200,
          bullet: data.elo?.bullet || 1200,
          classic: data.elo?.classic || 1200,
        },
        stats: data.stats || {
          wins: 0,
          losses: 0,
          draws: 0,
          winStreak: data.elo?.blitzStreak || 0,
          bestWinStreak: data.elo?.blitzStreak || 0,
          totalCrownsWon: 0,
        },
        createdAt: data.createdAt || new Date().toISOString(),
      };

      res.json(success({ user: publicProfile }));
    } catch (err: any) {
      logger.error('GetPublicProfile error', { error: err.message });
      res.status(500).json(error('Failed to fetch profile'));
    }
  },

  // ─── PATCH /v1/users/me ─────────────────────────────────────
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user?.uid;
      if (!uid) {
        res.status(401).json(error('Unauthorized'));
        return;
      }

      const { displayName, country, bio, avatarUrl } = req.body;
      const file = req.file;

      const updates: Record<string, any> = {};
      if (displayName !== undefined) updates.displayName = displayName.trim();
      if (country !== undefined) updates.country = country;
      if (bio !== undefined) updates.bio = bio.trim();
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

      // Handle custom image file upload
      if (file) {
        const extension = file.originalname.split('.').pop();
        const fileName = `avatars/${uid}/${Date.now()}_avatar.${extension}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });

        await fileUpload.makePublic();
        updates.avatarUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json(error('No fields to update'));
        return;
      }

      await db.collection('users').doc(uid).update(updates);

      const updatedDoc = await db.collection('users').doc(uid).get();
      const userData = updatedDoc.data() as any;

      if (!userData.kycStatus) userData.kycStatus = 'unverified';
      if (!userData.wallet) userData.wallet = { availableBalance: 0, stakedBalance: 0, bonusBalance: 0, currency: 'USD' };
      if (!userData.elo) userData.elo = { blitz: 1200, rapid: 1200, bullet: 1200, classic: 1200, gamesPlayed: 0 };

      res.json(success({ user: { uid, ...userData } }, 'Profile updated'));
    } catch (err: any) {
      logger.error('UpdateProfile error', { error: err.message });
      res.status(500).json(error('Failed to update profile'));
    }
  },

  // ─── GET /v1/users/:uid/games ───────────────────────────────
  async getUserGameHistory(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      // Query games where user was either White or Black
      const [whiteGames, blackGames] = await Promise.all([
        db.collection('games')
          .where('whiteUid', '==', uid)
          .where('status', '==', 'completed')
          .limit(limit)
          .get(),
        db.collection('games')
          .where('blackUid', '==', uid)
          .where('status', '==', 'completed')
          .limit(limit)
          .get(),
      ]);

      const allDocs = [...whiteGames.docs, ...blackGames.docs];

      // Cache opponent data to avoid redundant reads
      const opponentUids = new Set<string>();
      allDocs.forEach((doc) => {
        const data = doc.data();
        const oppUid = data.whiteUid === uid ? data.blackUid : data.whiteUid;
        if (oppUid && !oppUid.startsWith('bot') && !oppUid.startsWith('guest_')) {
          opponentUids.add(oppUid);
        }
      });

      const userDocsMap = new Map<string, any>();
      if (opponentUids.size > 0) {
        const snapshots = await Promise.all(
          Array.from(opponentUids).map((id) => db.collection('users').doc(id).get())
        );
        snapshots.forEach((snap) => {
          if (snap.exists) userDocsMap.set(snap.id, snap.data());
        });
      }

      const games: GameArchiveEntry[] = allDocs.map((doc) => {
        const data = doc.data();
        const isWhite = data.whiteUid === uid;
        const opponentUid = isWhite ? data.blackUid : data.whiteUid;
        const isOpponentBot = opponentUid === 'bot' || data.isBot;
        const opponentData = userDocsMap.get(opponentUid);

        let userResult: 'win' | 'loss' | 'draw' = 'draw';
        if (data.result === 'draw') {
          userResult = 'draw';
        } else if ((data.result === 'white' && isWhite) || (data.result === 'black' && !isWhite)) {
          userResult = 'win';
        } else {
          userResult = 'loss';
        }

        const stake = data.stakeAmountCrowns || 0;
        let netCrownsWon = 0;
        if (userResult === 'win') {
          netCrownsWon = stake; // Net profit (earned opponent's stake)
        } else if (userResult === 'loss') {
          netCrownsWon = -stake;
        }

        const category = data.timeControlCategory || 'blitz';
        const opponentElo = isOpponentBot
          ? (data.botDifficulty === 'master' ? 2200 : data.botDifficulty === 'advanced' ? 1700 : 1200)
          : (opponentData?.elo?.[category] ?? 1200);

        return {
          id: doc.id,
          opponent: {
            uid: opponentUid,
            displayName: isOpponentBot
              ? `Stockfish Bot (${data.botDifficulty || 'casual'})`
              : (opponentData?.displayName || (opponentUid.startsWith('guest_') ? 'Guest' : 'Player')),
            avatarUrl: isOpponentBot ? null : (opponentData?.avatarUrl || null),
            country: opponentData?.country || '',
            elo: opponentElo,
          },
          userColor: isWhite ? 'white' : 'black',
          result: userResult,
          resultReason: data.resultReason || 'resignation',
          timeControlCategory: category,
          timeControlId: data.timeControlId || 'blitz_3_0',
          stakeAmountCrowns: stake,
          netCrownsWon,
          movesCount: data.moves?.length || 0,
          pgn: data.pgn || '',
          fen: data.fen || '',
          completedAt: data.completedAt || new Date().toISOString(),
        };
      });

      // Sort by completedAt descending and limit
      games.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      const paginatedGames = games.slice(0, limit);

      res.json(success({ games: paginatedGames, total: paginatedGames.length }));
    } catch (err: any) {
      logger.error('GetUserGameHistory error', { error: err.message });
      res.status(500).json(error('Failed to fetch game history'));
    }
  },

  // ─── GET /v1/users/:uid/head-to-head ────────────────────────
  async getHeadToHead(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      const callerUid = (req as any).user?.uid || (req.query.callerUid as string);

      if (!callerUid) {
        res.status(400).json(error('Caller UID required for head-to-head comparison'));
        return;
      }

      const [whiteGames, blackGames] = await Promise.all([
        db.collection('games')
          .where('whiteUid', '==', callerUid)
          .where('blackUid', '==', uid)
          .where('status', '==', 'completed')
          .get(),
        db.collection('games')
          .where('whiteUid', '==', uid)
          .where('blackUid', '==', callerUid)
          .where('status', '==', 'completed')
          .get(),
      ]);

      const allMatches = [...whiteGames.docs, ...blackGames.docs];
      let userWins = 0;
      let opponentWins = 0;
      let draws = 0;

      allMatches.forEach((doc) => {
        const data = doc.data();
        const isCallerWhite = data.whiteUid === callerUid;
        if (data.result === 'draw') {
          draws++;
        } else if ((data.result === 'white' && isCallerWhite) || (data.result === 'black' && !isCallerWhite)) {
          userWins++;
        } else {
          opponentWins++;
        }
      });

      const stats: HeadToHeadStats = {
        totalGames: allMatches.length,
        userWins,
        opponentWins,
        draws,
        userScore: userWins + draws * 0.5,
        opponentScore: opponentWins + draws * 0.5,
      };

      res.json(success({ stats }));
    } catch (err: any) {
      logger.error('GetHeadToHead error', { error: err.message });
      res.status(500).json(error('Failed to fetch head-to-head stats'));
    }
  },
};
