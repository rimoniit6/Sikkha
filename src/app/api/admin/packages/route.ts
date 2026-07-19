import { apiResponse,parseIdsParam,validateBody,withAdmin,withCsrf } from '@/lib/api-utils'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { softDelete } from '@/lib/soft-delete'
import { createVersion } from '@/lib/version-history'
import { auditFromRequest, AuditActions, getClientIP } from '@/lib/audit'

const createPackageSchema = z.object({
  title: z.string().min(1, 'শিরোনাম প্রদান করুন'),
  description: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  price: z.coerce.number().min(0).optional(),
  originalPrice: z.number().min(0).optional(),
  duration: z.number().int().positive('সময়কাল আবশ্যক').optional(),
  durationLabel: z.string().optional(),
  classLevel: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

const updatePackageSchema = z.object({
  id: z.string().min(1, 'প্যাকেজ ID আবশ্যক'),
  ids: z.array(z.string()).optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  price: z.coerce.number().min(0).optional(),
  originalPrice: z.coerce.number().min(0).optional(),
  duration: z.coerce.number().int().positive().optional(),
  durationLabel: z.string().optional(),
  classLevel: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.coerce.number().min(0).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const classLevel = searchParams.get('classLevel') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (classLevel) {
      where.OR = [
        { classLevel: classLevel },
        { classLevel: null },
      ]
    }
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [packages, total] = await Promise.all([
      db.contentPackage.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { order: 'asc' },
          { price: 'asc' },
        ],
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      }),
      db.contentPackage.count({ where }),
    ])

    // Add subscription count to each package
    const enrichedPackages = packages.map(pkg => ({
      ...pkg,
      subscriptionCount: pkg._count.subscriptions,
    }))

    return apiResponse({
      packages: enrichedPackages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'Get packages error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const validation = validateBody(createPackageSchema, body)
    if ('error' in validation) return validation.error
    const { title, description, thumbnail, price, originalPrice, duration, durationLabel, classLevel, isActive, order } = validation.data

    // Generate base slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Auto-increment slug if it exists
    let slug = baseSlug
    let counter = 1
    while (await db.contentPackage.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const newPackage = await db.contentPackage.create({
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        price: price || 0,
        originalPrice: originalPrice || 0,
        duration: duration || 30,
        durationLabel: durationLabel || '৩০ দিন',
        classLevel: classLevel || null,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    })

    await invalidateContentCache('package')
    await auditFromRequest(request, auth.user.id, AuditActions.PACKAGE_CREATE, 'content_package', newPackage.id, body, { title: newPackage.title })
    return apiResponse(newPackage, 'প্যাকেজ তৈরি হয়েছে', 201)
  } catch (error) {
    return handleApiError(error, 'Create package error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const validation = validateBody(updatePackageSchema, body)
    if ('error' in validation) return validation.error
    const { id, ids, title, description, thumbnail, price, originalPrice, duration, durationLabel, classLevel, isActive, order } = validation.data

    if (Array.isArray(ids) && ids.length > 0) {
      const updateData: Record<string, unknown> = {}
      if (isActive !== undefined) updateData.isActive = isActive

      // Bulk update: create version for each affected entity
      const ipAddress = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || undefined

      await db.$transaction(async (tx) => {
        // Fetch all records to snapshot before updating
        const records = await tx.contentPackage.findMany({
          where: { id: { in: ids } },
        })

        // Create version for each record
        for (const record of records) {
          const changedFields = Object.keys(updateData).filter(
            key => JSON.stringify(updateData[key]) !== JSON.stringify(record[key as keyof typeof record])
          )
          if (changedFields.length > 0) {
            await createVersion(tx, 'contentPackage', record.id, { ...record }, auth.user.id, changedFields, {
              ipAddress,
              userAgent,
            })
          }
        }

        // Perform the bulk update
        await tx.contentPackage.updateMany({ where: { id: { in: ids } }, data: updateData })
      }, {
        maxWait: 10000,
        timeout: 30000,
      })

      await invalidateContentCache('package')
      await auditFromRequest(request, auth.user.id, AuditActions.PACKAGE_UPDATE, 'content_package', ids.join(','), undefined, { count: ids.length, updateData })
      return apiResponse({ updated: ids.length }, `${ids.length}টি আপডেট হয়েছে`)
    }

    if (!id) {
      return apiResponse(null, 'প্যাকেজ ID প্রদান করুন', 400)
    }

    const existing = await db.contentPackage.findUnique({ where: { id } })
    if (!existing) {
      return apiResponse(null, 'প্যাকেজ পাওয়া যায়নি', 404)
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (price !== undefined) updateData.price = price
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice
    if (duration !== undefined) updateData.duration = duration
    if (durationLabel !== undefined) updateData.durationLabel = durationLabel
    if (classLevel !== undefined) updateData.classLevel = classLevel
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    // Determine which fields actually changed
    const changedFields = Object.keys(updateData).filter(
      key => JSON.stringify(updateData[key]) !== JSON.stringify(existing[key as keyof typeof existing])
    )

    // Create version snapshot + update in single transaction
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const updated = await db.$transaction(async (tx) => {
      // Create version snapshot of current state BEFORE update
      await createVersion(tx, 'contentPackage', id, { ...existing }, auth.user.id, changedFields, {
        ipAddress,
        userAgent,
      })

      // Perform the actual update
      return tx.contentPackage.update({
        where: { id },
        data: updateData,
      })
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    await invalidateContentCache('package')
    await auditFromRequest(request, auth.user.id, AuditActions.PACKAGE_UPDATE, 'content_package', id, existing, updateData)
    return apiResponse(updated, 'প্যাকেজ আপডেট হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Update package error')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const { searchParams } = new URL(request.url)
    const ids = parseIdsParam(searchParams)
    if (ids) {
      for (const pkgId of ids) {
        const subs = await db.userSubscription.findMany({ where: { packageId: pkgId }, select: { id: true } })
        for (const sub of subs) {
          await softDelete(db, 'userSubscription', sub.id, auth.user.id)
        }
        await softDelete(db, 'contentPackage', pkgId, auth.user.id)
      }
      await invalidateContentCache('package')
      await auditFromRequest(request, auth.user.id, AuditActions.PACKAGE_DELETE, 'content_package', ids.join(','), undefined, { count: ids.length })
      return apiResponse({ deleted: ids.length }, `${ids.length}টি সফলভাবে মুছে ফেলা হয়েছে`)
    }
    const id = searchParams.get('id')

    if (!id) {
      return apiResponse(null, 'প্যাকেজ ID প্রদান করুন', 400)
    }

    const existing = await db.contentPackage.findUnique({ where: { id } })
    if (!existing) {
      return apiResponse(null, 'প্যাকেজ পাওয়া যায়নি', 404)
    }

    // Delete all subscriptions first (cascade should handle this, but be explicit)
    const subs = await db.userSubscription.findMany({ where: { packageId: id }, select: { id: true } })
    for (const sub of subs) {
      await softDelete(db, 'userSubscription', sub.id, auth.user.id)
    }
    await softDelete(db, 'contentPackage', id, auth.user.id)

    await invalidateContentCache('package')
    await auditFromRequest(request, auth.user.id, AuditActions.PACKAGE_DELETE, 'content_package', id)
    return apiResponse({ id }, 'প্যাকেজ মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Delete package error')
  }
}
