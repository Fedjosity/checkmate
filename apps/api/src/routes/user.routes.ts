import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../config/firebase.config';
import { logger } from '../utils/logger';
import { success, error } from '../utils/response';

const router = Router();

import multer from 'multer';
import { bucket } from '../config/firebase.config';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ─── PATCH /users/me ────────────────────────────────────────
router.patch('/me', requireAuth, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { displayName, country, avatarUrl } = req.body;
    const file = req.file;

    const updates: Record<string, any> = {};
    if (displayName !== undefined) updates.displayName = displayName.trim();
    if (country !== undefined) updates.country = country;
    
    // If a string avatarUrl was passed (e.g. they want to clear it or set it manually)
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    // If an actual file was uploaded, upload to Firebase Storage and get public URL
    if (file) {
      const extension = file.originalname.split('.').pop();
      const fileName = `avatars/${uid}/${Date.now()}_avatar.${extension}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      await fileUpload.makePublic();
      updates.avatarUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json(error('No fields to update'));
      return;
    }

    await db.collection('users').doc(uid).update(updates);

    const updatedDoc = await db.collection('users').doc(uid).get();
    res.json(success({ user: { uid, ...updatedDoc.data() } }, 'Profile updated'));
  } catch (err: any) {
    logger.error('UpdateMe error', { error: err.message });
    res.status(500).json(error('Failed to update profile'));
  }
});

// ─── GET /users/:uid ────────────────────────────────────────
router.get('/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      res.status(404).json(error('User not found'));
      return;
    }

    const data = doc.data()!;
    // Return only public fields
    const publicProfile = {
      uid,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      country: data.country,
      elo: data.elo,
      createdAt: data.createdAt,
    };

    res.json(success({ user: publicProfile }));
  } catch (err: any) {
    logger.error('GetPublicProfile error', { error: err.message });
    res.status(500).json(error('Failed to fetch profile'));
  }
});

export default router;
