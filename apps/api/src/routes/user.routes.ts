import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ─── User Profile & Settings ─────────────────────────────────
router.patch('/me', requireAuth, upload.single('avatar'), userController.updateProfile);
router.get('/:uid/games', userController.getUserGameHistory);
router.get('/:uid/head-to-head', userController.getHeadToHead);
router.get('/:uid', userController.getPublicProfile);

export default router;
