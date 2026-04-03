import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../utils/errors';

/**
 * RBAC middleware factory.
 * Usage: router.get('/admin', authenticate, authorize('ADMIN'), handler)
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Not authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      next(new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
};
