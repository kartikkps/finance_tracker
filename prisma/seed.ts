import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const rounds = 12;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@acme.com',
      passwordHash: await bcrypt.hash('Admin@123', rounds),
      role: 'ADMIN',
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@acme.com' },
    update: {},
    create: {
      name: 'Analyst User',
      email: 'analyst@acme.com',
      passwordHash: await bcrypt.hash('Analyst@123', rounds),
      role: 'ANALYST',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@acme.com' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'viewer@acme.com',
      passwordHash: await bcrypt.hash('Viewer@123', rounds),
      role: 'VIEWER',
    },
  });

  // Clear old records to prevent duplication on multiple seed runs
  await prisma.financialRecord.deleteMany({});

  // Seed financial records for analyst
  const records = [
    { userId: analyst.id, type: 'INCOME' as const, amount: 50000, category: 'Salary', date: new Date('2026-01-31'), notes: 'January salary' },
    { userId: analyst.id, type: 'INCOME' as const, amount: 50000, category: 'Salary', date: new Date('2026-02-28'), notes: 'February salary' },
    { userId: analyst.id, type: 'INCOME' as const, amount: 50000, category: 'Salary', date: new Date('2026-03-31'), notes: 'March salary' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 15000, category: 'Rent', date: new Date('2026-01-05'), notes: 'January rent' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 15000, category: 'Rent', date: new Date('2026-02-05'), notes: 'February rent' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 15000, category: 'Rent', date: new Date('2026-03-05'), notes: 'March rent' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 4500, category: 'Groceries', date: new Date('2026-01-15'), notes: 'Monthly groceries' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 3200, category: 'Groceries', date: new Date('2026-02-15'), notes: 'Monthly groceries' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 5100, category: 'Groceries', date: new Date('2026-03-15'), notes: 'Monthly groceries' },
    { userId: analyst.id, type: 'INCOME' as const, amount: 8000, category: 'Freelance', date: new Date('2026-02-20'), notes: 'Web design project' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 1200, category: 'Utilities', date: new Date('2026-01-20'), notes: 'Electric + internet' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 1100, category: 'Utilities', date: new Date('2026-02-20'), notes: 'Electric + internet' },
    { userId: analyst.id, type: 'EXPENSE' as const, amount: 1300, category: 'Utilities', date: new Date('2026-03-20'), notes: 'Electric + internet' },
    
    // Seed financial records for viewer
    { userId: viewer.id, type: 'INCOME' as const, amount: 35000, category: 'Salary', date: new Date('2026-01-25'), notes: 'Jan Salary' },
    { userId: viewer.id, type: 'EXPENSE' as const, amount: 8000, category: 'Rent', date: new Date('2026-01-28'), notes: 'Jan Rent' },
    { userId: viewer.id, type: 'EXPENSE' as const, amount: 2000, category: 'Groceries', date: new Date('2026-02-02'), notes: 'Groceries' },
  ];

  for (const record of records) {
    await prisma.financialRecord.create({ data: record });
  }

  console.log('✅ Seed complete!');
  console.log('📋 Test credentials:');
  console.log('  Admin:   admin@acme.com    / Admin@123');
  console.log('  Analyst: analyst@acme.com  / Analyst@123');
  console.log('  Viewer:  viewer@acme.com   / Viewer@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
