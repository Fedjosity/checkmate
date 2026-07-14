import { Router } from 'express';
import { requireAuth, allowGuestOrAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { botGameSchema, onlineGameSchema } from '../schemas/game.schema';
import * as gamesController from '../controllers/games.controller';

const router = Router();

// POST /api/v1/games/bot — Create a bot game (auth required)
router.post('/bot', requireAuth, validateRequest(botGameSchema), gamesController.createBotGame);

// POST /api/v1/games/online — Join Play Online queue (guests or auth)
router.post('/online', allowGuestOrAuth, validateRequest(onlineGameSchema), gamesController.createPlayOnlineGame);

// GET /api/v1/games/history — Get game history (auth required)
router.get('/history', requireAuth, gamesController.getGameHistory);

// GET /api/v1/games/:id — Get a specific game (guests or auth)
router.get('/:id', allowGuestOrAuth, gamesController.getGame);

export default router;
