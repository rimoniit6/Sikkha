import { db } from '../src/lib/db'

async function seed() {
  console.log('Checking navigation...')

  const existing = await db.navigation.findFirst({
    where: { route: 'course-list', location: 'header' }
  });

  if (existing) {
    console.log('Courses nav already exists')
    return
  }

  await db.navigation.createMany({
    data: [
      { label: 'কোর্স', route: 'course-list', icon: 'BookOpen', location: 'header', order: 3, isAuthOnly: false, isAdminOnly: false, isActive: true },
    ],
  })

  console.log('Added Courses navigation')

  // Verify
  const items = await db.navigation.findMany({
    where: { location: 'header' },
    orderBy: { order: 'asc' }
  })

  console.log('\nHeader Navigation Items:')
  items.forEach(i => console.log(i.order, i.label, i.route))
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })