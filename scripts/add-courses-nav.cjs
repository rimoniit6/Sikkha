// Add কোর্স (Courses) to navigation via Prisma direct DB access
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'db', 'custom.db')}`;
const adapter = new PrismaLibSql({ url: dbUrl });
const db = new PrismaClient({ adapter });

async function main() {
  try {
    // Check if course-list already exists
    const existing = await db.navigation.findFirst({
      where: { route: 'course-list', location: 'header' }
    });

    if (existing) {
      console.log('Courses nav already exists:', existing.label);
      // Reactivate if inactive
      if (!existing.isActive) {
        await db.navigation.update({
          where: { id: existing.id },
          data: { isActive: true, label: 'কোর্স', order: 3 }
        });
        console.log('Reactivated existing item');
      }
    } else {
      // Create new item
      const item = await db.navigation.create({
        data: {
          label: 'কোর্স',
          route: 'course-list',
          icon: 'BookOpen',
          location: 'header',
          order: 3,
          isAuthOnly: false,
          isAdminOnly: false,
          isActive: true,
        }
      });
      console.log('Created:', item.id, item.label);
    }

    // Reorder: shift exams to order 4
    await db.navigation.updateMany({
      where: { route: 'exam-center', location: 'header' },
      data: { order: 4 }
    });

    // Shift suggestions, board-questions, notices, premium, admin
    await db.navigation.updateMany({
      where: { route: 'suggestions', location: 'header' },
      data: { order: 5 }
    });
    await db.navigation.updateMany({
      where: { route: 'board-questions', location: 'header' },
      data: { order: 6 }
    });
    await db.navigation.updateMany({
      where: { route: 'notices', location: 'header' },
      data: { order: 7 }
    });
    await db.navigation.updateMany({
      where: { route: 'premium', location: 'header' },
      data: { order: 8 }
    });
    await db.navigation.updateMany({
      where: { route: 'admin-dashboard', location: 'header' },
      data: { order: 9 }
    });

    console.log('Reordering complete');

    // Show final header navigation
    const headerItems = await db.navigation.findMany({
      where: { location: 'header', isActive: true },
      orderBy: { order: 'asc' }
    });

    console.log('\n=== Header Navigation (after fix) ===');
    headerItems.forEach(i => console.log(`  ${i.order} ${i.label} -> ${i.route}`));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await db.$disconnect();
  }
}

main();