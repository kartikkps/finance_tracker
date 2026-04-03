import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import * as userService from './user.service';
import { successResponse } from '../../utils/response';

export const getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.json(successResponse(users, `${users.length} users found`));
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserById(String(req.params.id));
    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.updateUserRole(String(req.params.id), req.body.role as Role);
    res.json(successResponse(user, 'Role updated successfully'));
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await userService.deleteUser(String(req.params.id));
    res.json(successResponse(null, 'User deleted successfully'));
  } catch (err) {
    next(err);
  }
};
