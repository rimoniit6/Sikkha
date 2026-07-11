import "server-only"

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { sanitizeForStorage } from './sanitize'
import { join } from 'path'

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

const isProduction = process.env.NODE_ENV === 'production'

// Create libSQL adapter for SQLite - PrismaLibSql is a factory in v7
const projectRoot = process.cwd()
const dbPath = join(projectRoot, 'dev.db')
const dbUrl = `file:${dbPath}`

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: dbUrl })

  const client = new PrismaClient({
    adapter,
    log: isProduction ? ['error', 'warn'] : ['error', 'warn'],
  })

  const xclient = client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, args: queryArgs, query }) {
          const modelName = model?.toLowerCase() || ''
          if (MODELS_WITH_HTML.has(modelName)) {
            const fields = HTML_FIELDS[modelName]
            const data = (queryArgs as Record<string, unknown>).data
            if (data) {
              const items = Array.isArray(data) ? data : [data]
              for (const item of items) {
                sanitizeData(item as Record<string, unknown>, fields)
              }
            }
          }
          return query(queryArgs as never)
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