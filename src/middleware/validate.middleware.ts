import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodRawShape, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

/**
 * Zod validation middleware factory.
 * Usage: router.post('/', validate(schema), handler)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validate = (schema: ZodObject<ZodRawShape>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Zod v4 uses .issues instead of .errors
        const errors = err.issues.map((e) => ({
          field: e.path.slice(1).join('.'), // remove body/query/params prefix
          message: e.message,
        }));
        res.status(400).json(errorResponse('Validation failed', errors));
        return;
      }
      next(err);
    }
  };
};
