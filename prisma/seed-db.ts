import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { join } from 'path'

const dbUrl = process.env.DATABASE_URL || `file:${join(process.cwd(), 'dev.db')}`

const adapter = new PrismaLibSql({ url: dbUrl })
const db = new PrismaClient({ adapter })

process.on('beforeExit', async () => {
  await db.$disconnect()
})

export { db }