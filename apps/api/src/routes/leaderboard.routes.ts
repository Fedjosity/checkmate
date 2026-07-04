import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';

const router = Router();

// GET /v1/leaderboard — public
router.get('/', leaderboardController.getLeaderboard);

// GET /v1/leaderboard/stats — public
router.get('/stats', leaderboardController.getStats);

export default router;
