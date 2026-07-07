import { Router } from 'express';
import { success } from '../utils/response';
import waitlistRoutes from './waitlist.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import walletRoutes from './wallet.routes';
import leaderboardRoutes from './leaderboard.routes';
import webhookRoutes from './webhook.routes';
import matchmakingRoutes from './matchmaking.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json(success('CheckMate API is running'));
});

// Webhooks — mounted before auth-protected routes, no auth required
router.use('/webhooks', webhookRoutes);

router.use('/v1/waitlist', waitlistRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/wallet', walletRoutes);
router.use('/v1/leaderboard', leaderboardRoutes);
router.use('/v1/matchmaking', matchmakingRoutes);

export default router;
