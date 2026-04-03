import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateRoleSchema } from './user.schema';
import * as userController from './user.controller';

const router = Router();

// All user management routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/users
router.get('/', userController.getAllUsers);

// GET /api/users/:id
router.get('/:id', userController.getUserById);

// PATCH /api/users/:id/role
router.patch('/:id/role', validate(updateRoleSchema), userController.updateUserRole);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

export default router;
