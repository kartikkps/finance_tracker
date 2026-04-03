import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import recordRoutes from './modules/records/record.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { AppError } from './utils/errors';
import { errorResponse } from './utils/response';

const app = express();

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

// ── Documentation ────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Finance Tracker API is running ✅', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(errorResponse(err.message));
  }
  console.error('Unhandled error:', err);
  return res.status(500).json(errorResponse('Internal server error'));
});

export default app;
