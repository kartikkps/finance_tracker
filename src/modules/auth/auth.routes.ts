import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

export default router;
