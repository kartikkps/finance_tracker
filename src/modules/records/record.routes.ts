import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createRecordSchema, updateRecordSchema, listRecordsSchema } from './record.schema';
import * as recordController from './record.controller';

const router = Router();

// All record routes require authentication
router.use(authenticate);

// POST /api/records — Analyst + Admin can create
router.post('/', authorize('ANALYST', 'ADMIN'), validate(createRecordSchema), recordController.createRecord);

// GET /api/records — All roles (Viewer sees own, others see all)
router.get('/', validate(listRecordsSchema), recordController.listRecords);

// GET /api/records/:id — All roles (ownership enforced in service)
router.get('/:id', recordController.getRecordById);

// PUT /api/records/:id — Analyst (own records) + Admin (any record)
router.put('/:id', authorize('ANALYST', 'ADMIN'), validate(updateRecordSchema), recordController.updateRecord);

// DELETE /api/records/:id — Admin only
router.delete('/:id', authorize('ADMIN'), recordController.deleteRecord);

export default router;
