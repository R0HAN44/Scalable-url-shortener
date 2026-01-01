import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../modules/auth/auth';
import { verifyToken } from '../modules/auth/auth';

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers['authorization'] || req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}
