import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSettingSchema = z.object({
  key: z.string().min(1, 'কী আবশ্যক'),
  value: z.string().min(1, 'ভ্যালু আবশ্যক'),
  group: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
})

const MAX_BATCH_SIZE = 200

const batchSettingSchema = z
  .object({
    key: z
      .string()
      .min(1, 'কী খালি থাকতে পারবে না')
      .max(191, 'কী খুব বড়'),
    value: z
      .string()
      .max(100000, 'ভ্যালু খুব বড়'),
    group: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
  })
  .strict()

const batchUpdateSchema = z.object({
  settings: z
    .array(batchSettingSchema)
    .min(1, 'সেটিংস অ্যারে আবশ্যক')
    .max(MAX_BATCH_SIZE, 'সেটিংস অ্যারে খুব বড়'),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const data = await db.siteSetting.findMany({
      orderBy: { key: 'asc' },
    })

    // Also return as key-value map for convenience
    const map: Record<string, string> = {}
    for (const setting of data) {
      map[setting.key] = setting.value
    }

    return apiResponse({ data, map })
  } catch (error) {
    return handleApiError(error, 'Admin Get Settings')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const validation = validateBody(createSettingSchema, body)
    if ('error' in validation) return validation.error
    const { key, value, group, label } = validation.data

    const existing = await db.siteSetting.findUnique({ where: { key } })
    if (existing) {
      return apiError('এই কী ইতিমধ্যে বিদ্যমান, আপডেট করতে PUT ব্যবহার করুন', 409)
    }

    const data = await db.siteSetting.create({
      data: { key, value, group: group || null, label: label || null },
    })

    await invalidateContentCache('settings')
    return apiResponse({ data }, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Setting')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const validation = validateBody(createSettingSchema, body)
    if ('error' in validation) return validation.error
    const { key, value, group, label } = validation.data

    const existing = await db.siteSetting.findUnique({ where: { key } })
    if (!existing) {
      return apiError('সেটিং খুঁজে পাওয়া যায়নি, নতুন তৈরি করতে POST ব্যবহার করুন', 404)
    }

    const data = await db.siteSetting.update({
      where: { key },
      data: {
        value,
        ...(group !== undefined ? { group } : {}),
        ...(label !== undefined ? { label } : {}),
      },
    })

    await invalidateContentCache('settings')
    return apiResponse({ data })
  } catch (error) {
    return handleApiError(error, 'Admin Update Setting')
  }
}

export async function PATCH(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const validation = validateBody(batchUpdateSchema, body)
    if ('error' in validation) return validation.error
    const { settings } = validation.data

    const seen = new Set<string>()
    for (const s of settings) {
      if (seen.has(s.key)) {
        return apiError(`ডুপ্লিকেট কী: ${s.key}`, 400, 'DUPLICATE_KEY')
      }
      seen.add(s.key)
    }

    await Promise.all(
      settings.map((s) =>
        db.siteSetting.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            value: s.value,
            group: s.group || null,
            label: s.label || null,
          },
          update: {
            value: s.value,
            ...(s.group !== undefined ? { group: s.group } : {}),
            ...(s.label !== undefined ? { label: s.label } : {}),
          },
        })
      )
    )

    invalidateContentCache('settings')
    return apiResponse({ data: { updated: settings.length } })
  } catch (error) {
    return handleApiError(error, 'Admin Batch Update Settings')
  }
}
