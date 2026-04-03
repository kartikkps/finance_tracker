import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';
import type { AuthUser } from '../types/express.d';


interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
};
