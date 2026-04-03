import { Prisma } from '@prisma/client';
import prisma from '../../config/db';

interface SummaryFilters {
  userId?: string; // scoped for VIEWER
  from?: string;
  to?: string;
}

export const getSummary = async (filters: SummaryFilters) => {
  const where: Prisma.FinancialRecordWhereInput = {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  };

  const result = await prisma.financialRecord.groupBy({
    by: ['type'],
    where,
    _sum: { amount: true },
    _count: { id: true },
  });

  const incomeRow = result.find((r) => r.type === 'INCOME');
  const expenseRow = result.find((r) => r.type === 'EXPENSE');

  const totalIncome = Number(incomeRow?._sum.amount ?? 0);
  const totalExpense = Number(expenseRow?._sum.amount ?? 0);
  const incomeCount = incomeRow?._count.id ?? 0;
  const expenseCount = expenseRow?._count.id ?? 0;

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    netBalance: (totalIncome - totalExpense).toFixed(2),
    totalRecords: incomeCount + expenseCount,
    incomeCount,
    expenseCount,
    period: {
      from: filters.from || 'all-time',
      to: filters.to || 'all-time',
    },
  };
};

export const getMonthlyTrends = async (userId?: string) => {
  const userFilter = userId ? Prisma.sql`AND "user_id" = ${userId}::uuid` : Prisma.sql``;

  const rows = await prisma.$queryRaw<
    { month: string; income: string; expense: string; net: string }[]
  >`
    SELECT
      TO_CHAR(date, 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0)::text AS income,
      COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0)::text AS expense,
      COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)::text AS net
    FROM financial_records
    WHERE 1=1 ${userFilter}
    GROUP BY month
    ORDER BY month ASC
  `;

  return rows;
};

export const getCategoryBreakdown = async (userId?: string) => {
  const where: Prisma.FinancialRecordWhereInput = {
    type: 'EXPENSE',
    ...(userId ? { userId } : {}),
  };

  const result = await prisma.financialRecord.groupBy({
    by: ['category'],
    where,
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  return result.map((r) => ({
    category: r.category,
    totalAmount: Number(r._sum.amount ?? 0).toFixed(2),
    count: r._count.id,
  }));
};

export const getTopRecords = async (limit = 5) => {
  return prisma.financialRecord.findMany({
    orderBy: { amount: 'desc' },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};
