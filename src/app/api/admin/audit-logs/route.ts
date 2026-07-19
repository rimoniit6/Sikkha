import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parsePaginationParams } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

// ============================================================
// Admin Audit Log API
// Supports:
//   - List with pagination, search, date filter, action filter, user filter
//   - Detail view by id
// GET params (list):
//   page, limit          pagination
//   q                    free-text search (action / entityType / entityId)
//   action               exact action filter
//   adminId              admin/user filter
//   entityType           entity type filter
//   from, to             ISO date range filter (createdAt)
// GET params (detail):
//   id                   single audit log id
// ============================================================

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // ── Detail view ─────────────────────────────────────────────
    if (id) {
      const log = await db.auditLog.findUnique({
        where: { id },
        include: {
          admin: { select: { id: true, name: true, email: true, role: true } },
        },
      })
      if (!log) return apiError('Audit log not found', 404, 'NOT_FOUND')
      return apiResponse(mapLog(log))
    }

    // ── List view ───────────────────────────────────────────────
    const { page, limit } = parsePaginationParams(searchParams)
    const q = searchParams.get('q')?.trim()
    const action = searchParams.get('action')?.trim()
    const adminId = searchParams.get('adminId')?.trim()
    const entityType = searchParams.get('entityType')?.trim()
    const from = searchParams.get('from')?.trim()
    const to = searchParams.get('to')?.trim()

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (adminId) where.adminId = adminId
    if (entityType) where.entityType = entityType
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
    }
    if (q) {
      where.OR = [
        { action: { contains: q } },
        { entityType: { contains: q } },
        { entityId: { contains: q } },
      ]
    }

    const [data, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          admin: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    return paginatedApiResponse(
      data.map(mapLog),
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    )
  } catch (error) {
    return handleApiError(error, 'Admin Audit Logs List')
  }
}

function mapLog(log: Record<string, unknown>) {
  return {
    id: log.id,
    adminId: log.adminId,
    admin: log.admin ?? null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldData: parseJsonSafe(log.oldData),
    newData: parseJsonSafe(log.newData),
    ipAddress: log.ipAddress ?? null,
    userAgent: log.userAgent ?? null,
    userName: log.userName ?? null,
    userRole: log.userRole ?? null,
    status: log.status ?? 'success',
    duration: log.duration ?? null,
    os: log.os ?? null,
    browser: log.browser ?? null,
    country: log.country ?? null,
    createdAt: log.createdAt,
    deletedAt: log.deletedAt ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonSafe(value: unknown): any {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
