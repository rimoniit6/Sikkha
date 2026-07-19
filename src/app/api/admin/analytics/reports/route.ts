import { db } from '@/lib/db'
import { apiResponse, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const reports = await db.analyticsReport.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return apiResponse(
      reports.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        format: r.format,
        schedule: r.schedule,
        recipients: r.recipients as string[] | null,
        lastGenerated: r.lastGenerated?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    return handleApiError(error, 'Reports List')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { name, description, type, format, schedule, recipients } = body

    const report = await db.analyticsReport.create({
      data: {
        name,
        description,
        type,
        format: format || 'xlsx',
        schedule: schedule || null,
        recipients: recipients ? JSON.stringify(recipients) : null,
        config: JSON.stringify({ sections: [type] }),
      },
    })

    await auditFromRequest(request, auth.user.id, 'analytics_report_create', 'analytics_report', report.id, body as Record<string, unknown>, { name: report.name } as Record<string, unknown>)
    return apiResponse({
      id: report.id,
      name: report.name,
      description: report.description,
      type: report.type,
      format: report.format,
      schedule: report.schedule,
      recipients: report.recipients as string[] | null,
      lastGenerated: null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    })
  } catch (error) {
    return handleApiError(error, 'Create Report')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Report ID required' }, { status: 400 })
    }

    await db.analyticsReport.delete({ where: { id } })

    await auditFromRequest(request, auth.user.id, 'analytics_report_delete', 'analytics_report', id, undefined, undefined)
    return apiResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error, 'Delete Report')
  }
}
