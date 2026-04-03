import { Request, Response, NextFunction } from 'express';
import { RecordType } from '@prisma/client';
import * as recordService from './record.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export const createRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await recordService.createRecord(req.user!.id, req.body);
    res.status(201).json(successResponse(record, 'Record created successfully'));
  } catch (err) {
    next(err);
  }
};

export const listRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query as Record<string, string | string[] | undefined>;
    const getString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

    const type = getString(q.type) as RecordType | undefined;
    const category = getString(q.category);
    const from = getString(q.from);
    const to = getString(q.to);
    const pageStr = getString(q.page);
    const limitStr = getString(q.limit);
    const search = getString(q.search);
    const role = req.user!.role;

    const filters = {
      type,
      category,
      from,
      to,
      page: pageStr ? parseInt(pageStr) : undefined,
      limit: limitStr ? parseInt(limitStr) : undefined,
      search,
      userId: role === 'VIEWER' ? req.user!.id : undefined,
    };

    const { records, total, page: pg, limit: lm } = await recordService.listRecords(filters);
    res.json(paginatedResponse(records, { page: pg, limit: lm, total }));
  } catch (err) {
    next(err);
  }
};

export const getRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await recordService.getRecordById(String(req.params.id), req.user!.id, req.user!.role);
    res.json(successResponse(record));
  } catch (err) {
    next(err);
  }
};

export const updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await recordService.updateRecord(String(req.params.id), req.user!.id, req.user!.role, req.body);
    res.json(successResponse(record, 'Record updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await recordService.deleteRecord(String(req.params.id));
    res.json(successResponse(null, 'Record deleted successfully'));
  } catch (err) {
    next(err);
  }
};
