import { Request, Response } from 'express';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { db } from '../config/firebase.config';
import { rpToRank } from '@checkmate/shared-types';
import { success, error } from '../utils/response';
import { logger } from '../utils/logger';

export const createBotGame = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { difficulty, timeControl, playerColor } = req.body;

    const gameId = await gameService.createBotGame({
      uid,
      timeControl,
      difficulty,
      playerColor,
    });

    logger.info('Bot game created', { gameId, uid, difficulty, timeControl });
    res.json(success({ gameId }));
  } catch (err: any) {
    logger.error('Failed to create bot game', { error: err.message });
    res.status(400).json(error(err.message));
  }
};

export const createPlayOnlineGame = async (req: Request, res: Response) => {
  try {
    const isGuest = (req as any).isGuest;
    const { timeControl } = req.body;

    let uid: string;
    let elo: number;
    let rank: any;

    if (isGuest) {
      const guestUser = (req as any).guestUser;
      uid = guestUser.guestId;
      elo = guestUser.elo;
      rank = rpToRank(0, false);
    } else {
      uid = (req as any).user.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data()!;
      elo = userData.elo?.[timeControl] ?? 1200;
      const rp = userData.elo?.[`${timeControl}RP`] ?? 0;
      rank = rpToRank(rp, userData.elo?.isTop500);
    }

    // Check if already in queue
    if (matchmakingService.getEntry(uid)) {
      res.status(409).json(error('You are already in a matchmaking queue'));
      return;
    }

    matchmakingService.addToQueue({
      uid,
      socketId: '',
      mode: 'play_online',
      timeControl: timeControl as any,
      stakeAmountCrowns: 0,
      elo,
      rank,
      joinedAt: new Date(),
      status: 'waiting',
    });

    res.json(success({ queued: true }));
  } catch (err: any) {
    logger.error('Failed to create play online game', { error: err.message });
    res.status(400).json(error(err.message));
  }
};

export const getGame = async (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;
    const game = await gameService.getGame(gameId);

    if (!game) {
      res.status(404).json(error('Game not found'));
      return;
    }

    // Verify requesting player is in this game
    const isGuest = (req as any).isGuest;
    const requesterId = isGuest
      ? (req as any).guestUser.guestId
      : (req as any).user.uid;

    const gameData = game as any;
    if (gameData.whiteUid !== requesterId && gameData.blackUid !== requesterId) {
      res.status(403).json(error('You are not a participant in this game'));
      return;
    }

    res.json(success({ game }));
  } catch (err: any) {
    logger.error('Failed to fetch game', { error: err.message });
    res.status(400).json(error(err.message));
  }
};

export const getGameHistory = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await gameService.getGameHistory(uid, page, limit);

    res.json(success(result));
  } catch (err: any) {
    logger.error('Failed to fetch game history', { error: err.message });
    res.status(400).json(error(err.message));
  }
};
