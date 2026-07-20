import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Check FAQ accessor
const names = ['fAQ', 'FAQ', 'faq', 'mCQ', 'MCQ', 'mcq', 'cQ', 'CQ', 'cq', 'board', 'chapter', 'user']
for (const name of names) {
  try {
    const val = db[name]
    console.log(`db['${name}']:`, typeof val, val ? 'EXISTS' : 'UNDEFINED/NULL')
  } catch (e) {
    console.log(`db['${name}']: ERROR - ${e.message}`)
  }
}

// Also check via Object.keys, getOwnPropertyNames, etc
console.log('\n--- Reflection ---')
const proto = Object.getPrototypeOf(db)
const own = Object.getOwnPropertyNames(db).filter(n => !n.startsWith('$') && !n.startsWith('_'))
console.log('Own properties (non-$):', own.slice(0, 20))

// Try to find FAQ by findUnique on what SHOULD be the FAQ accessor
for (const accessorName of ['fAQ', 'FAQ', 'faq']) {
  try {
    const delegate = db[accessorName]
    if (delegate && typeof delegate.findUnique === 'function') {
      console.log(`\n${accessorName}.findUnique is a function ✓`)
      // Try to count FAQ records
      const count = await delegate.count()
      console.log(`${accessorName}.count():`, count)
    } else {
      console.log(`\n${accessorName}: not a valid model delegate`)
    }
  } catch (e) {
    console.log(`\n${accessorName}: ERROR - ${e.message}`)
  }
}

await db.$disconnect()
