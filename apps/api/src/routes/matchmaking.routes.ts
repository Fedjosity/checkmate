import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { joinLobby, leaveLobby, getQueueDepths, getStatus } from '../controllers/matchmaking.controller';

const router = Router();

router.post('/join', requireAuth, joinLobby);
router.delete('/leave', requireAuth, leaveLobby);
router.get('/depths', getQueueDepths); // public
router.get('/status', requireAuth, getStatus);

export default router;
