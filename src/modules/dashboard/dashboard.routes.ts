import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(authenticate);

// GET /api/dashboard/summary — All roles (Viewer sees own data)
router.get('/summary', dashboardController.getSummary);

// GET /api/dashboard/trends — Analyst + Admin
router.get('/trends', authorize('ANALYST', 'ADMIN'), dashboardController.getMonthlyTrends);

// GET /api/dashboard/categories — Analyst + Admin
router.get('/categories', authorize('ANALYST', 'ADMIN'), dashboardController.getCategoryBreakdown);

// GET /api/dashboard/top-records — Admin only
router.get('/top-records', authorize('ADMIN'), dashboardController.getTopRecords);

export default router;
