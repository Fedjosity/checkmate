import { Request, Response } from 'express';
import { db } from '../config/firebase.config';
import { matchmakingService } from '../services/matchmaking.service';
import { escrowCrowns, releaseEscrow } from '../services/wallet.service';
import { rpToRank } from '@checkmate/shared-types';

export const joinLobby = async (req: Request, res: Response) => {
  try {
    const { mode, timeControl, stakeAmountCrowns } = req.body;
    const uid = (req as any).user.uid;

    if (matchmakingService.getEntry(uid)) {
      res.status(409).json({ success: false, error: 'You are already in a matchmaking queue' });
      return;
    }

    if (mode === 'paid') {
      await escrowCrowns(uid, stakeAmountCrowns, `escrow_${uid}_${Date.now()}`);
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data()!;
    const elo = userData.elo?.[timeControl] ?? 1200;
    const rp = userData.elo?.[`${timeControl}RP`] ?? 0;
    const rank = rpToRank(rp, userData.elo?.isTop500);

    matchmakingService.addToQueue({
      uid,
      socketId: '',
      mode,
      timeControl,
      stakeAmountCrowns: mode === 'paid' ? stakeAmountCrowns : 0,
      elo,
      rank,
      joinedAt: new Date(),
      status: 'waiting',
    });

    res.json({ success: true, data: { queued: true, queuePosition: matchmakingService.getAllEntries().length } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const leaveLobby = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const entry = matchmakingService.removeFromQueue(uid);

    if (entry && entry.stakeAmountCrowns > 0) {
      await releaseEscrow(uid, entry.stakeAmountCrowns);
    }

    res.json({ success: true, data: { left: true, crownsReturned: entry?.stakeAmountCrowns ?? 0 } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getQueueDepths = async (req: Request, res: Response) => {
  try {
    const entries = matchmakingService.getAllEntries();
    const depthsMap = new Map<string, number>();

    for (const entry of entries) {
      if (entry.status === 'waiting') {
        const key = `${entry.mode}_${entry.timeControl}_${entry.stakeAmountCrowns}`;
        depthsMap.set(key, (depthsMap.get(key) || 0) + 1);
      }
    }

    const depthsArray = Array.from(depthsMap.entries()).map(([key, depth]) => {
      const [mode, timeControl, stake] = key.split('_');
      return {
        mode,
        timeControl,
        stakeAmountCrowns: Number(stake),
        depth,
      };
    });

    res.json({ success: true, data: { depths: depthsArray } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const entry = matchmakingService.getEntry(uid);

    if (entry) {
      res.json({ success: true, data: { status: entry.status } });
      return;
    }

    const gamesSnap = await db.collection('games')
      .where('status', '==', 'active')
      .get();
    
    let foundGameId = null;
    for (const doc of gamesSnap.docs) {
      const data = doc.data();
      if (data.whiteUid === uid || data.blackUid === uid) {
        foundGameId = doc.id;
        break;
      }
    }

    if (foundGameId) {
      res.json({ success: true, data: { status: 'matched', gameId: foundGameId } });
      return;
    }

    res.json({ success: true, data: { status: 'not_in_queue' } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
