import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';
import { AppError, ConflictError, UnauthorizedError } from '../../utils/errors';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const register = async (name: string, email: string, password: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('Email is already registered');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return user;
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new UnauthorizedError('Invalid email or password');

  if (!JWT_SECRET) throw new AppError('JWT_SECRET not configured', 500);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new UnauthorizedError('User not found');
  return user;
};
