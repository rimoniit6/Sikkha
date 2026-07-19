import { apiResponse, apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import {
  getTrashRetentionSettings,
  updateTrashSettings,
  previewTrashCleanup,
  runTrashCleanup,
  TRASH_SETTINGS,
} from '@/lib/trash-cleanup'
import { NextResponse } from 'next/server'

// GET: Get trash retention settings and cleanup status
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const settings = await getTrashRetentionSettings()

    // Get preview of what would be cleaned
    const preview = await previewTrashCleanup(settings.retentionDays)

    return apiResponse({
      settings,
      preview: {
        totalRecords: preview.totalRecords,
        models: preview.models,
        cutoffDate: preview.cutoffDate,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Trash Cleanup GET')
  }
}

// POST: Run cleanup or update settings
export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'updateSettings') {
      const { retentionDays, enabled, batchSize } = body

      const updates: Record<string, string> = {}

      if (retentionDays !== undefined) {
        const validDays = [0, 7, 15, 30, 60, 90, 180, 365]
        if (!validDays.includes(retentionDays)) {
          return apiError('অবৈধ মেয়াদ। 0, 7, 15, 30, 60, 90, 180, বা 365 দিন নির্বাচন করুন।', 400)
        }
        updates[TRASH_SETTINGS.RETENTION_DAYS] = String(retentionDays)
      }

      if (enabled !== undefined) {
        updates[TRASH_SETTINGS.ENABLE_CLEANUP] = String(enabled)
      }

      if (batchSize !== undefined) {
        if (batchSize < 10 || batchSize > 1000) {
          return apiError('ব্যাচ সাইজ 10-1000 এর মধ্যে হতে হবে।', 400)
        }
        updates[TRASH_SETTINGS.BATCH_SIZE] = String(batchSize)
      }

      if (Object.keys(updates).length > 0) {
        await updateTrashSettings(updates)
      }

      const settings = await getTrashRetentionSettings()
      return apiResponse({ settings }, 'সেটিংস আপডেট করা হয়েছে')
    }

    if (action === 'preview') {
      const { retentionDays } = body
      const days = retentionDays || 90
      const preview = await previewTrashCleanup(days)
      return apiResponse(preview)
    }

    if (action === 'runCleanup') {
      const { dryRun, retentionDays } = body

      // Override retention days if provided
      if (retentionDays !== undefined) {
        await updateTrashSettings({
          [TRASH_SETTINGS.RETENTION_DAYS]: String(retentionDays),
        })
      }

      const result = await runTrashCleanup({
        dryRun: dryRun === true,
        userId: auth.user.id,
        trigger: 'manual',
      })

      return apiResponse(result, result.success
        ? result.dryRun
          ? `পূর্বরূপ: ${result.preview.totalRecords}টি রেকর্ড মুছে ফেলা হবে`
          : `${result.totalDeleted}টি পুরানো রেকর্ড পরিষ্কার করা হয়েছে`
        : 'পরিষ্কার ব্যর্থ হয়েছে')
    }

    return apiError('অবৈধ অ্যাকশন', 400)
  } catch (error) {
    return handleApiError(error, 'Admin Trash Cleanup POST')
  }
}
