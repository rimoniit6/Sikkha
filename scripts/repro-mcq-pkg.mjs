import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { join } from 'path';

const dbUrl = process.env.DATABASE_URL || `file:${join(process.cwd(), 'db', 'custom.db')}`;
const adapter = new PrismaLibSql({ url: dbUrl });
const db = new PrismaClient({ adapter });

try {
  const packages = await db.mCQExamPackage.findMany({
    where: { status: 'PUBLISHED', isActive: true },
    take: 12,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: {
      class: { select: { id: true, name: true, slug: true } },
      examSets: {
        where: { status: 'PUBLISHED' },
        orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }],
        select: { id: true, scheduledDate: true, startTime: true, endTime: true, duration: true, totalMarks: true, totalQuestions: true, order: true },
      },
      _count: { select: { examSets: true, purchases: true } },
    },
  });
  console.log('OK — packages:', packages.length);
} catch (e) {
  console.error('REPRO ERROR:', e.message);
} finally {
  await db.$disconnect();
}
