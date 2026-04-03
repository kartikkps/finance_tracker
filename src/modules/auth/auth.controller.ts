import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { successResponse } from '../../utils/response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.register(name, email, password);
    res.status(201).json(successResponse(user, 'User registered successfully'));
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(successResponse(result, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.status(200).json(successResponse(user, 'Profile fetched'));
  } catch (err) {
    next(err);
  }
};
