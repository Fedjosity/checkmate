import { Router } from 'express';
import { allowGuestOrAuth } from '../middleware/auth.middleware';
import { joinLobby, leaveLobby, getQueueDepths, getStatus } from '../controllers/matchmaking.controller';

const router = Router();

router.post('/join', allowGuestOrAuth, joinLobby);
router.delete('/leave', allowGuestOrAuth, leaveLobby);
router.get('/depths', getQueueDepths); // public
router.get('/status', allowGuestOrAuth, getStatus);

export default router;
