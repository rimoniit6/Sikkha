import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { analyzeDeleteImpact, analyzeBulkDeleteImpact, SOFT_DELETE_MODELS, getPrismaModel } from '@/lib/soft-delete'
import { NextResponse } from 'next/server'

// POST: Analyze impact of deleting records
export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { ids, model, cascade } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return apiError('আইডি আবশ্যক', 400)
    }

    // Resolve models for all IDs
    const items: Array<{ model: string; id: string }> = []
    const unresolvedIds: string[] = []

    for (const id of ids) {
      let resolvedModel = model
      if (!resolvedModel) {
        for (const modelName of SOFT_DELETE_MODELS) {
          try {
            const record = await (db as any)[getPrismaModel(modelName)].findUnique({
              where: { id },
              includeDeleted: true,
            })
            if (record && record.deletedAt) {
              resolvedModel = modelName
              break
            }
          } catch {
            continue
          }
        }
      }

      if (resolvedModel) {
        items.push({ model: resolvedModel, id })
      } else {
        unresolvedIds.push(id)
      }
    }

    if (items.length === 0) {
      return apiError('কোনো বৈধ রেকর্ড পাওয়া যায়নি', 404)
    }

    // Analyze impact
    let impact
    if (items.length === 1) {
      impact = await analyzeDeleteImpact(db, items[0].model, items[0].id, { cascade: cascade === true })
      // Add unresolved as errors
      for (const id of unresolvedIds) {
        impact.errors.push(`মডেল খুঁজে পাওয়া যায়নি: ${id}`)
      }
    } else {
      impact = await analyzeBulkDeleteImpact(db, items, { cascade: cascade === true })
      // Add unresolved as errors
      for (const id of unresolvedIds) {
        impact.errors.push(`মডেল খুঁজে পাওয়া যায়নি: ${id}`)
      }
    }

    return apiResponse(impact)
  } catch (error) {
    return handleApiError(error, 'Admin Trash Impact Analysis')
  }
}
