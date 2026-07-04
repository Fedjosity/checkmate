import { Request, Response } from 'express';
import { db } from '../config/firebase.config';
import { logger } from '../utils/logger';
import { success, error } from '../utils/response';

export const walletController = {
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const uid = (req as any).user.uid;
      const doc = await db.collection('users').doc(uid).get();

      if (!doc.exists) {
        res.status(404).json(error('User not found'));
        return;
      }

      const userData = doc.data()!;
      const wallet = userData.wallet ?? {
        availableBalance: 0,
        stakedBalance: 0,
        bonusBalance: 0,
        currency: 'USD',
      };

      res.json(success({ wallet }));
    } catch (err: any) {
      logger.error('GetBalance error', { error: err.message });
      res.status(500).json(error('Failed to fetch wallet balance'));
    }
  },
};
