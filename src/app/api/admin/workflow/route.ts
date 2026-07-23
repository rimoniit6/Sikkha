import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { getClientIP } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { transitionWorkflow, getWorkflow, getWorkflowHistory, ACTION_TARGET_STATE, type WorkflowAction } from '@/lib/workflow'

const VALID_ACTIONS: WorkflowAction[] = [
  'submit_for_review', 'approve', 'reject', 'publish',
  'schedule', 'archive', 'reset_to_draft',
]

// Reuses ACTION_TARGET_STATE from workflow.ts as the single source of truth

// Entity types whose `status` field should be synced with workflow transitions.
// Maps workflow status → entity status so the entity reflects the workflow state.
const ENTITY_STATUS_SYNC: Record<string, Record<string, string>> = {
  mCQExamPackage: {
    DRAFT: 'DRAFT',
    IN_REVIEW: 'DRAFT',
    APPROVED: 'DRAFT',
    REJECTED: 'DRAFT',
    SCHEDULED: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED',
  },
  cQExamPackage: {
    DRAFT: 'DRAFT',
    IN_REVIEW: 'DRAFT',
    APPROVED: 'DRAFT',
    REJECTED: 'DRAFT',
    SCHEDULED: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ARCHIVED: 'ARCHIVED',
  },
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { entityType, entityId, action, comment, expectedVersion, scheduledAt } = body

    if (!entityType || !entityId || !action) {
      return apiError('entityType, entityId, and action are required', 400)
    }

    if (!VALID_ACTIONS.includes(action)) {
      return apiError(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`, 400)
    }

    // Reject requires comment
    if (action === 'reject' && (!comment || !comment.trim())) {
      return apiError('প্রত্যাখ্যানের জন্য মন্তব্য আবশ্যক', 400)
    }

    // expectedVersion is required for optimistic concurrency
    if (expectedVersion === undefined || expectedVersion === null) {
      return apiError('expectedVersion is required', 400)
    }

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined

    // Compute entity status update from workflow transition
    const targetState = ACTION_TARGET_STATE[action as WorkflowAction]
    const statusSync = ENTITY_STATUS_SYNC[entityType]
    const contentUpdate = statusSync && targetState
      ? { data: { status: statusSync[targetState] || 'DRAFT' } }
      : undefined

    const result = await transitionWorkflow(db as never, {
      entityType,
      entityId,
      action,
      userId: auth.user.id,
      userRole: auth.user.role,
      expectedVersion,
      comment: comment || undefined,
      ipAddress,
      userAgent,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      workflowComment: {
        authorName: auth.user.email,
        authorRole: auth.user.role,
      },
      contentUpdate,
    })

    if (!result.success) {
      const message = result.conflict
        ? 'এই কন্টেন্টটি অন্য একজন প্রশাসক দ্বারা পরিবর্তন করা হয়েছে। রিফ্রেশ করে আবার চেষ্টা করুন।'
        : result.error
      return NextResponse.json({
        success: false,
        error: message,
        conflict: result.conflict || false,
        version: result.version,
      }, { status: result.httpStatus })
    }

    // Fetch updated workflow state
    const workflow = await getWorkflow(db as never, entityType, entityId)

    return apiResponse({
      success: true,
      workflow,
      transition: {
        from: result.previousState,
        to: result.newState,
        version: result.version,
        transitionTime: result.transitionTime,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Workflow Transition')
  }
}

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return apiError('entityType and entityId are required', 400)
    }

    const workflow = await getWorkflow(db as never, entityType, entityId)
    const history = await getWorkflowHistory(db as never, entityType, entityId)
    const comments = await db.workflowComment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    })

    return apiResponse({ workflow, history, comments })
  } catch (error) {
    return handleApiError(error, 'Get Workflow')
  }
}
