import { Router } from 'express';
import { success } from '../utils/response';
import waitlistRoutes from './waitlist.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (req, res) => {
  res.json(success('CheckMate API is running'));
});

router.use('/v1/waitlist', waitlistRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);

export default router;
