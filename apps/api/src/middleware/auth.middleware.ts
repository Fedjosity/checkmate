import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.config';
import { AppError } from '../utils/errors';

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
