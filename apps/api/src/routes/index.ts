import { Router } from 'express';
import { success } from '../utils/response';

const router = Router();

router.get('/health', (req, res) => {
  res.json(success('CheckMate API is running'));
});

export default router;
