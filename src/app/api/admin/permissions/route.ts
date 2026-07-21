import { applyRateLimit,validateBody,withCsrf } from '@/lib/api-utils'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { invalidatePermissionCache,requirePermission } from '@/lib/auth'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'
import { apiLimiter } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updatePermissionSchema = z.object({
  permissionId: z.string().min(1, 'permissionId প্রয়োজন'),
  roles: z.array(z.enum(['SUPER_ADMIN', 'ADMIN', 'STUDENT'])),
})

export async function GET(request: Request) {
  try {
    await applyRateLimit(apiLimiter, request)
    await requirePermission(request, 'system.rbac')

    const permissions = await db.permission.findMany({
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
      include: {
        roles: {
          select: { role: true },
        },
      },
    })

    const data = permissions.map(p => ({
      id: p.id,
      name: p.name,
      group: p.group,
      description: p.description,
      roles: p.roles.map(r => r.role),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return handleApiError(error, 'Get permissions error')
  }
}

export async function PUT(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    await applyRateLimit(apiLimiter, request)
    await requirePermission(request, 'system.rbac')

    const body = await request.json()
    const validation = validateBody(updatePermissionSchema, body)
    if ('error' in validation) return validation.error
    const { permissionId, roles } = validation.data

    // Atomic: delete old + create new + audit log in a single transaction
    // If anything fails, everything rolls back — permissions are never left in a partial state
    await db.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { permissionId } })
      for (const role of roles) {
        await tx.rolePermission.create({
          data: { role: role as any, permissionId },
        })
      }
      await auditFromRequest(request, 'system', AuditActions.PERMISSION_UPDATE, 'permission', permissionId, undefined, { permissionId, roles }, tx as never)
    }, {
      maxWait: 5000,
      timeout: 10000,
    })

    invalidatePermissionCache()

    return NextResponse.json({ success: true, message: 'পারমিশন আপডেট করা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Update permissions error')
  }
}
