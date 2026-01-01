import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { UserRow } from '../users/users.repository';

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

export function generateToken(user: UserRow): string {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

export function verifyToken(token: string): { id: number; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
  } catch {
    return null;
  }
}
