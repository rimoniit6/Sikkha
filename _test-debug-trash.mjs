// Test the model resolution directly
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { Prisma } from '@prisma/client'
import { join } from 'path'

const projectRoot = process.cwd()
const dbUrl = `file:${join(projectRoot, 'db/custom.db')}`
const adapter = new PrismaLibSql({ url: dbUrl })
const client = new PrismaClient({ adapter, log: ['error'] })

// Check what happens with $extends
const SOFT_DELETE_MODELS = new Set(['faq', 'mcq', 'cq', 'chapter', 'board', 'classCategory', 'subject', 'topic', 'knowledgeQuestion', 'lecture', 'resource', 'suggestion', 'course', 'courseLesson', 'banner', 'testimonial', 'notice', 'navigation', 'contentType', 'featuredContent', 'contentBundle', 'contentPackage', 'mcqExamPackage', 'cqExamPackage', 'teacherModerator', 'examYear', 'boardYear', 'exam', 'userSubscription', 'mcqExamPackagePurchase', 'cqExamPackagePurchase'])

function injectSoftDeleteFilter(args) {
  if (args.includeDeleted) {
    delete args.includeDeleted
    return
  }
  if (args.where && typeof args.where === 'object') {
    const where = args.where
    if (where.deletedAt === undefined) {
      where.deletedAt = null
    }
  }
}

const xclient = client.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, args, query }) {
        const modelName = model?.toLowerCase() || ''
        if (SOFT_DELETE_MODELS.has(modelName)) {
          if ('where' in args || 'include' in args || 'select' in args) {
            injectSoftDeleteFilter(args)
          }
        }
        return query(args)
      },
    },
  },
})

// Test 1: Direct access to fAQ on extended client
console.log('=== Accessor Test ===')
const accessors = ['fAQ', 'FAQ', 'faq', 'mCQ', 'MCQ', 'mcq', 'cQ', 'CQ', 'cq']
for (const name of accessors) {
  const val = xclient[name]
  console.log(`xclient['${name}']:`, typeof val, val ? 'EXISTS' : 'UNDEFINED')
  if (val && typeof val.findUnique === 'function') {
    console.log(`  -> findUnique: FUNCTION ✓`)
  }
}

// Test 2: Direct findUnique for the FAQ record
console.log('\n=== Model Resolution Test ===')
const testId = 'cmrnutl4u00bnaofiyahz7eb1'

// Try fAQ directly
console.log('\n--- Trying fAQ ---')
try {
  const record = await xclient['fAQ'].findUnique({
    where: { id: testId },
    includeDeleted: true,
  })
  console.log('Result:', record ? JSON.stringify({ id: record.id, deletedAt: record.deletedAt, question: record.question }) : 'NULL')
} catch (e) {
  console.log('ERROR:', e.message)
}

// Try FAQ directly  
console.log('\n--- Trying FAQ ---')
try {
  const record = await xclient['FAQ'].findUnique({
    where: { id: testId },
    includeDeleted: true,
  })
  console.log('Result:', record ? JSON.stringify({ id: record.id, deletedAt: record.deletedAt, question: record.question }) : 'NULL')
} catch (e) {
  console.log('ERROR:', e.message)
}

// Try faq directly
console.log('\n--- Trying faq ---')
try {
  const record = await xclient['faq'].findUnique({
    where: { id: testId },
    includeDeleted: true,
  })
  console.log('Result:', record ? JSON.stringify({ id: record.id, deletedAt: record.deletedAt, question: record.question }) : 'NULL')
} catch (e) {
  console.log('ERROR:', e.message)
}

// Test 3: Same but WITHOUT includeDeleted (should filter it out)
console.log('\n--- Without includeDeleted (should return null) ---')
try {
  const record = await xclient['fAQ'].findUnique({ where: { id: testId } })
  console.log('Result:', record ? JSON.stringify({ id: record.id, deletedAt: record.deletedAt }) : 'NULL (correctly filtered)')
} catch (e) {
  console.log('ERROR:', e.message)
}

await client.$disconnect()
