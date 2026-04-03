import { RecordType, Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

interface ListFilters {
  type?: RecordType;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  search?: string;
  userId?: string; // scoped for VIEWER
}

export const createRecord = async (
  userId: string,
  data: { type: RecordType; amount: number; category: string; date: string; notes?: string }
) => {
  return prisma.financialRecord.create({
    data: {
      userId,
      type: data.type,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes,
    },
  });
};

export const listRecords = async (filters: ListFilters) => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 10, 100); // cap at 100
  const skip = (page - 1) * limit;

  const where: Prisma.FinancialRecordWhereInput = {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.category ? { category: { contains: filters.category, mode: 'insensitive' } } : {}),
    ...(filters.search
      ? {
          OR: [
            { category: { contains: filters.search, mode: 'insensitive' } },
            { notes: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return { records, total, page, limit };
};

export const getRecordById = async (id: string, userId: string, role: string) => {
  const record = await prisma.financialRecord.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!record) throw new NotFoundError('Record');

  // Viewers can only see their own records
  if (role === 'VIEWER' && record.userId !== userId) {
    throw new ForbiddenError('You can only view your own records');
  }

  return record;
};

export const updateRecord = async (
  id: string,
  userId: string,
  role: string,
  data: { type?: RecordType; amount?: number; category?: string; date?: string; notes?: string }
) => {
  const record = await prisma.financialRecord.findUnique({ where: { id } });
  if (!record) throw new NotFoundError('Record');

  // Analysts can only edit their own records; Admins can edit any
  if (role === 'ANALYST' && record.userId !== userId) {
    throw new ForbiddenError('Analysts can only update their own records');
  }

  return prisma.financialRecord.update({
    where: { id },
    data: {
      ...(data.type ? { type: data.type } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });
};

export const deleteRecord = async (id: string) => {
  const record = await prisma.financialRecord.findUnique({ where: { id } });
  if (!record) throw new NotFoundError('Record');
  await prisma.financialRecord.delete({ where: { id } });
};
