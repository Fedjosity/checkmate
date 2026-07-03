import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../config/firebase.config';
import { emailService } from '../services/email/email.service';
import { emailVerificationTemplate } from '../templates/emailVerification.template';
import { logger } from '../utils/logger';
import { success, error } from '../utils/response';
import * as admin from 'firebase-admin';

const router = Router();

// ─── Default values for new users ───────────────────────────
const DEFAULT_WALLET = {
  availableBalance: 0,
  stakedBalance: 0,
  bonusBalance: 0,
  currency: 'USD',
};

const DEFAULT_ELO = {
  blitz: 1200,
  rapid: 1200,
  bullet: 1200,
  classic: 1200,
  gamesPlayed: 0,
};

// ─── Helper: generate a 6-digit OTP ─────────────────────────
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── POST /auth/register ────────────────────────────────────
router.post('/register', requireAuth, async (req: Request, res: Response) => {
  try {
    const firebaseUser = (req as any).user;
    const { displayName, email, country } = req.body;

    if (!displayName || !email || !country) {
      res.status(400).json(error('displayName, email, and country are required'));
      return;
    }

    const uid = firebaseUser.uid;

    // Check if user already exists (idempotent for Google sign-in retries)
    const existingDoc = await db.collection('users').doc(uid).get();
    if (existingDoc.exists) {
      const userData = existingDoc.data();
      res.json(success({ user: { uid, ...userData } }, 'User already registered'));
      return;
    }

    // Check if Firebase has already verified this email (Google sign-in)
    const isEmailVerified = firebaseUser.email_verified === true;

    const now = new Date().toISOString();
    const userData = {
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      country,
      avatarUrl: firebaseUser.picture || null,
      emailVerified: isEmailVerified,
      wallet: DEFAULT_WALLET,
      elo: DEFAULT_ELO,
      createdAt: now,
    };

    await db.collection('users').doc(uid).set(userData);

    // If email is NOT verified (email/password sign-up), generate and send OTP
    // [DISABLED] - Using native Firebase mail verification for now
    /*
    if (!isEmailVerified) {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.collection('emailVerifications').doc(uid).set({
        code,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        attempts: 0,
        maxAttempts: 5,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Send verification email
      const firstName = displayName.split(' ')[0];
      await emailService.send({
        to: email.toLowerCase().trim(),
        toName: displayName,
        subject: 'Verify your email — CheckMate',
        htmlBody: emailVerificationTemplate(firstName, code),
      });

      logger.info(`Verification email sent to ${email}`);
    }
    */

    res.status(201).json(success({ user: { uid, ...userData } }, 'User registered'));
  } catch (err: any) {
    logger.error('Register error', { error: err.message });
    res.status(500).json(error('Registration failed. Please try again.'));
  }
});

// ─── GET /auth/me ───────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      res.status(404).json(error('User not found'));
      return;
    }

    res.json(success({ user: { uid, ...doc.data() } }));
  } catch (err: any) {
    logger.error('GetMe error', { error: err.message });
    res.status(500).json(error('Failed to fetch user'));
  }
});

// ─── POST /auth/verify-email ────────────────────────────────
router.post('/verify-email', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json(error('Verification code is required'));
      return;
    }

    const verificationRef = db.collection('emailVerifications').doc(uid);
    const verificationDoc = await verificationRef.get();

    if (!verificationDoc.exists) {
      res.status(400).json(error('No verification code found. Request a new one.'));
      return;
    }

    const verification = verificationDoc.data()!;

    // Check expiry
    const expiresAt = verification.expiresAt.toDate();
    if (new Date() > expiresAt) {
      await verificationRef.delete();
      res.status(400).json(error('Code expired. Request a new one.'));
      return;
    }

    // Check max attempts
    if (verification.attempts >= verification.maxAttempts) {
      await verificationRef.delete();
      res.status(429).json(error('Too many attempts. Request a new code.'));
      return;
    }

    // Increment attempts
    await verificationRef.update({
      attempts: admin.firestore.FieldValue.increment(1),
    });

    // Validate code
    if (verification.code !== code.trim()) {
      const remaining = verification.maxAttempts - (verification.attempts + 1);
      res.status(400).json(
        error(`Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`)
      );
      return;
    }

    // Success — update user and clean up
    await db.collection('users').doc(uid).update({ emailVerified: true });
    await verificationRef.delete();

    res.json(success({ emailVerified: true }, 'Email verified successfully'));
  } catch (err: any) {
    logger.error('VerifyEmail error', { error: err.message });
    res.status(500).json(error('Verification failed. Please try again.'));
  }
});

// ─── POST /auth/resend-verification ─────────────────────────
router.post('/resend-verification', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;

    // Get user to check emailVerified status
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).json(error('User not found'));
      return;
    }

    const userData = userDoc.data()!;
    if (userData.emailVerified) {
      res.status(400).json(error('Email is already verified'));
      return;
    }

    // Check cooldown — don't allow resend within 60 seconds
    const verificationRef = db.collection('emailVerifications').doc(uid);
    const existingDoc = await verificationRef.get();
    if (existingDoc.exists) {
      const existing = existingDoc.data()!;
      const createdAt = existing.createdAt?.toDate?.();
      if (createdAt && (Date.now() - createdAt.getTime()) < 60000) {
        res.status(429).json(error('Please wait a moment before requesting again.'));
        return;
      }
    }

    // [DISABLED] - Using native Firebase mail verification for now
    /*
    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await verificationRef.set({
      code,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      attempts: 0,
      maxAttempts: 5,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const firstName = userData.displayName.split(' ')[0];
    await emailService.send({
      to: userData.email,
      toName: userData.displayName,
      subject: 'Your new verification code — CheckMate',
      htmlBody: emailVerificationTemplate(firstName, code),
    });

    logger.info(`Resent verification email to ${userData.email}`);
    res.json(success(null, 'New verification code sent'));
    */
    res.status(400).json(error('Custom verification is temporarily disabled. Use Firebase native link.'));
  } catch (err: any) {
    logger.error('ResendVerification error', { error: err.message });
    res.status(500).json(error('Failed to resend code. Please try again.'));
  }
});

export default router;
