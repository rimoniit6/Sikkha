import "server-only"
import { join } from 'path'

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { sanitizeForStorage } from './sanitize'
import { SOFT_DELETE_MODELS } from './soft-delete'

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

const HTML_FIELDS: Record<string, string[]> = {
  lecture: ['content'],
  mcq: ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation'],
  cq: ['uddeepok', 'question1', 'question2', 'question3', 'question4', 'answer1', 'answer2', 'answer3', 'answer4'],
  suggestion: ['content'],
  notice: ['content'],
  banner: ['title', 'subtitle'],
  faq: ['question', 'answer'],
  testimonial: ['content'],
  exam: ['instructions'],
  sitesetting: ['value'],
}

const MODELS_WITH_HTML = new Set(Object.keys(HTML_FIELDS))

function sanitizeData(data: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    if (typeof data[field] === 'string') {
      data[field] = sanitizeForStorage(data[field])
    }
  }
}

/**
 * Inject `deletedAt: null` into WHERE clauses for soft-delete models.
 * Bypassed when `includeDeleted: true` is present in args.
 */
function injectSoftDeleteFilter(args: Record<string, unknown>): void {
  if (args.includeDeleted) {
    delete args.includeDeleted
    return
  }

  // Inject into top-level where
  if (args.where && typeof args.where === 'object') {
    const where = args.where as Record<string, unknown>
    if (where.deletedAt === undefined) {
      where.deletedAt = null
    }
  }
}

const isProduction = process.env.NODE_ENV === 'production'

// Create libSQL adapter for SQLite - PrismaLibSql is a factory in v7
const projectRoot = process.cwd()
const dbUrl = process.env.DATABASE_URL || `file:${join(projectRoot, 'dev.db')}`

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: dbUrl })

  const client = new PrismaClient({
    adapter,
    log: isProduction ? ['error', 'warn'] : ['error', 'warn'],
  })

  const xclient = client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args: queryArgs, query }) {
          const modelName = model?.toLowerCase() || ''
          const args = queryArgs as Record<string, unknown>

          // 0. AuditLog immutability guard — block destructive operations
          if (modelName === 'auditlog') {
            if (operation === 'update' || operation === 'updateMany' || operation === 'upsert' ||
                operation === 'delete' || operation === 'deleteMany') {
              throw new Error(
                'AuditLog records are immutable. Append-only writes are enforced at the database layer. ' +
                'To create audit entries, use createAuditLog() from @/lib/audit.'
              )
            }
          }

          // 1. HTML sanitization for write operations
          if (MODELS_WITH_HTML.has(modelName)) {
            const fields = HTML_FIELDS[modelName]
            const data = args.data
            if (data) {
              const items = Array.isArray(data) ? data : [data]
              for (const item of items) {
                sanitizeData(item as Record<string, unknown>, fields)
              }
            }
          }

          // 2. Soft delete auto-filter for Category A models (read operations only)
          if (SOFT_DELETE_MODELS.has(modelName)) {
            // Only filter on read operations: findMany, findFirst, findUnique, count
            // Skip: create, update, delete, upsert, aggregate
            if ('where' in args || 'include' in args || 'select' in args) {
              injectSoftDeleteFilter(args)
            }
          }

          return query(args as never)
        },
      },
    },
  })

  return xclient
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (!isProduction) globalForPrisma.prisma = db

if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}
