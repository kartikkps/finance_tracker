import prisma from '../../config/db';
import { Role } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export const getAllUsers = async () => {
  return prisma.user.findMany({ select: safeUserSelect, orderBy: { createdAt: 'desc' } });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  if (!user) throw new NotFoundError('User');
  return user;
};

export const updateUserRole = async (id: string, role: Role) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  return prisma.user.update({
    where: { id },
    data: { role },
    select: safeUserSelect,
  });
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');
  await prisma.user.delete({ where: { id } });
};
