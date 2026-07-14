import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { join } from 'path'

const dbPath = join(process.cwd(), 'dev.db')
const dbUrl = `file:${dbPath}`

const adapter = new PrismaLibSql({ url: dbUrl })
const db = new PrismaClient({ adapter })

process.on('beforeExit', async () => {
  await db.$disconnect()
})

export { db }