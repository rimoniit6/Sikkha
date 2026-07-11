import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = resolve(__dirname, '..', 'dev.db')
const dbUrl = `file:///${dbPath.replace(/\\/g, '/').replace(/ /g, '%20')}`

const adapter = new PrismaLibSql({ url: dbUrl })
const db = new PrismaClient({ adapter })

process.on('beforeExit', async () => {
  await db.$disconnect()
})

export { db }