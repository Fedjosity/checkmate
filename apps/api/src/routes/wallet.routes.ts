import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { walletController } from '../controllers/wallet.controller';

const router = Router();

// GET /v1/wallet/balance
router.get('/balance', requireAuth, walletController.getBalance);

export default router;
