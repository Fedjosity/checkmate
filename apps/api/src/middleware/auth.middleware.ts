import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.config';
import { AppError } from '../utils/errors';
import { getGuestSession } from '../services/guestSession.service';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized: Missing or invalid token', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Attach user to request (requires extending Express.Request)
    (req as any).user = decodedToken;
    
    next();
  } catch (error) {
    next(new AppError('Unauthorized: Invalid token', 401));
  }
};

/**
 * Middleware that accepts both authenticated Firebase users AND guest sessions.
 * Used for endpoints accessible to guests (e.g., Play Online, Bot games).
 *
 * - Firebase Bearer token → req.user, req.isGuest = false
 * - X-Guest-Id header → req.guestUser, req.isGuest = true
 * - Neither → 401
 */
export const allowGuestOrAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // Try Firebase auth first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      (req as any).user = decodedToken;
      (req as any).isGuest = false;
      return next();
    }

    // Fall back to guest session
    const guestId = req.headers['x-guest-id'] as string;
    if (guestId) {
      const guestSession = getGuestSession(guestId);
      if (guestSession) {
        (req as any).guestUser = guestSession;
        (req as any).isGuest = true;
        return next();
      }
    }

    // Neither valid auth nor valid guest
    throw new AppError('Unauthorized: Provide a valid token or guest session', 401);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Unauthorized: Invalid credentials', 401));
  }
};

