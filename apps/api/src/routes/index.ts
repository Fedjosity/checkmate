import { Router } from 'express';
import { success } from '../utils/response';
import waitlistRoutes from './waitlist.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json(success('CheckMate API is running'));
});

router.use('/v1/waitlist', waitlistRoutes);

export default router;
