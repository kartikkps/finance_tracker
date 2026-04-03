import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { successResponse } from '../../utils/response';

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to } = req.query as Record<string, string>;
    const role = req.user!.role;
    const userId = role === 'VIEWER' ? req.user!.id : undefined;

    const summary = await dashboardService.getSummary({ userId, from, to });
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
};

export const getMonthlyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user!.role;
    const userId = role === 'VIEWER' ? req.user!.id : undefined;

    const trends = await dashboardService.getMonthlyTrends(userId);
    res.json(successResponse(trends));
  } catch (err) {
    next(err);
  }
};

export const getCategoryBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user!.role;
    const userId = role === 'VIEWER' ? req.user!.id : undefined;

    const breakdown = await dashboardService.getCategoryBreakdown(userId);
    res.json(successResponse(breakdown));
  } catch (err) {
    next(err);
  }
};

export const getTopRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const records = await dashboardService.getTopRecords(limit);
    res.json(successResponse(records));
  } catch (err) {
    next(err);
  }
};
