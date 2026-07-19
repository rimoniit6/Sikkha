import { PrismaClient } from '@prisma/client'
import { createVersion, isVersionableModel } from './version-history'
import { parseUserAgent } from './user-agent-parser'

// ─── Types ───

export type WorkflowStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED'

export type WorkflowAction =
  | 'submit_for_review'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'schedule'
  | 'archive'
  | 'reset_to_draft'
  | 'update_content'

export interface WorkflowState {
  id: string
  entityType: string
  entityId: string
  status: WorkflowStatus
  version: number
  submittedBy: string | null
  submittedAt: Date | null
  reviewedBy: string | null
  reviewedAt: Date | null
  reviewComment: string | null
  approvedBy: string | null
  approvedAt: Date | null
  publishedBy: string | null
  publishedAt: Date | null
  publishedVersionId: string | null
  scheduledAt: Date | null
  unpublishedAt: Date | null
  rejectedBy: string | null
  rejectedAt: Date | null
  rejectionReason: string | null
  archivedBy: string | null
  archivedAt: Date | null
  metadata: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TransitionResponse {
  success: boolean
  previousState: WorkflowStatus | null
  newState: WorkflowStatus | null
  version: number | null
  transitionTime: number | null
  performedBy: string | null
  error?: string
  conflict?: boolean
  httpStatus: number
  /** The updated content record (only when contentUpdate is provided) */
  contentRecord?: unknown
}

export interface TransitionOptions {
  entityType: string
  entityId: string
  action: WorkflowAction
  userId: string
  userName?: string
  userRole?: string
  comment?: string
  expectedVersion: number
  ipAddress?: string
  userAgent?: string
  scheduledAt?: Date
  /** When provided, the content update happens inside the same atomic transaction */
  contentUpdate?: {
    data: Record<string, unknown>
    include?: Record<string, unknown>
  }
  /** Changed fields to record in Version History snapshot */
  changedFields?: string[]
  /** When provided, a WorkflowComment is created inside the same atomic transaction */
  workflowComment?: {
    authorName?: string
    authorRole?: string
  }
}

// ─── Allowed Transitions ───

const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  DRAFT: ['IN_REVIEW', 'PUBLISHED'],
  IN_REVIEW: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['PUBLISHED', 'SCHEDULED', 'DRAFT'],
  SCHEDULED: ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT'],
  REJECTED: ['DRAFT'],
}

const ADMIN_DRAFT_TRANSITIONS: WorkflowStatus[] = [
  'DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED',
  'SCHEDULED', 'PUBLISHED', 'ARCHIVED',
]

// ─── Action → Target State Mapping ───

const ACTION_TARGET_STATE: Record<WorkflowAction, WorkflowStatus> = {
  submit_for_review: 'IN_REVIEW',
  approve: 'APPROVED',
  reject: 'REJECTED',
  publish: 'PUBLISHED',
  schedule: 'SCHEDULED',
  archive: 'ARCHIVED',
  reset_to_draft: 'DRAFT',
  update_content: 'DRAFT', // placeholder — stays in current state
}

// ─── Required Roles per Action ───

const ACTION_REQUIRED_ROLES: Record<WorkflowAction, string[]> = {
  submit_for_review: ['ADMIN', 'SUPER_ADMIN'],
  approve: ['ADMIN', 'SUPER_ADMIN'],
  reject: ['ADMIN', 'SUPER_ADMIN'],
  publish: ['ADMIN', 'SUPER_ADMIN'],
  schedule: ['ADMIN', 'SUPER_ADMIN'],
  archive: ['ADMIN', 'SUPER_ADMIN'],
  reset_to_draft: ['ADMIN', 'SUPER_ADMIN'],
  update_content: ['ADMIN', 'SUPER_ADMIN'],
}

// ─── Bengali Labels ───

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  DRAFT: 'খসড়া',
  IN_REVIEW: 'পর্যালোচনায়',
  APPROVED: 'অনুমোদিত',
  REJECTED: 'প্রত্যাখ্যাত',
  SCHEDULED: 'নির্ধারিত',
  PUBLISHED: 'প্রকাশিত',
  ARCHIVED: 'আর্কাইভ',
}

export const WORKFLOW_ACTION_LABELS: Record<WorkflowAction, string> = {
  submit_for_review: 'পর্যালোচনায় পাঠানো',
  approve: 'অনুমোদন',
  reject: 'প্রত্যাখ্যান',
  publish: 'প্রকাশ',
  schedule: 'নির্ধারণ',
  archive: 'আর্কাইভ',
  reset_to_draft: 'খসড়ায় ফেরানো',
  update_content: 'কন্টেন্ট আপডেট',
}

// ─── Audit Action Mapping ───

const ACTION_AUDIT_KEY: Record<WorkflowAction, string> = {
  submit_for_review: 'WORKFLOW_SUBMIT_FOR_REVIEW',
  approve: 'WORKFLOW_APPROVE',
  reject: 'WORKFLOW_REJECT',
  publish: 'WORKFLOW_PUBLISH',
  schedule: 'WORKFLOW_SCHEDULE',
  archive: 'WORKFLOW_ARCHIVE',
  reset_to_draft: 'WORKFLOW_RESET_TO_DRAFT',
  update_content: 'CONTENT_UPDATE',
}

// ─── Prisma Model Name Map ───

const ENTITY_PRISMA_MODEL: Record<string, string> = {
  lecture: 'lecture',
  mCQ: 'mCQ',
  cQ: 'cQ',
  knowledgeQuestion: 'knowledgeQuestion',
  suggestion: 'suggestion',
  course: 'course',
  courseLesson: 'courseLesson',
  exam: 'exam',
  mCQExamPackage: 'mCQExamPackage',
  cQExamPackage: 'cQExamPackage',
  contentPackage: 'contentPackage',
  contentBundle: 'contentBundle',
  siteSetting: 'siteSetting',
}

// ─── Single Orchestrator ───

/**
 * The ONLY valid entry point for workflow transitions and content updates.
 *
 * When contentUpdate is provided, performs the content update INSIDE the
 * same atomic transaction as all workflow side effects:
 *   1. Auto-create workflow record if missing
 *   2. Validate transition + permission + optimistic concurrency
 *   3. Create Version History snapshot
 *   4. Update content record (if contentUpdate provided)
 *   5. Update workflow state + increment version
 *   6. Create WorkflowHistory entry
 *   7. Create AuditLog entry
 *
 * If ANY step fails: ROLLBACK EVERYTHING.
 */
export async function transitionWorkflow(
  db: PrismaClient,
  options: TransitionOptions
): Promise<TransitionResponse> {
  const startTime = Date.now()
  const {
    entityType, entityId, action, userId,
    userName, userRole, comment, expectedVersion,
    ipAddress, userAgent, scheduledAt,
    contentUpdate, changedFields,
  } = options

  const targetState = ACTION_TARGET_STATE[action]
  const isUpdateContent = action === 'update_content'
  const effectiveTargetState = isUpdateContent ? null : targetState
  const prismaModel = ENTITY_PRISMA_MODEL[entityType]

  // ─── Step 1: Find or auto-create workflow record ───

  let current = await db.contentWorkflow.findFirst({
    where: { entityType, entityId },
  })

  if (!current) {
    // Auto-create workflow for legacy content without a workflow record
    const now = new Date()
    current = await db.contentWorkflow.create({
      data: {
        entityType,
        entityId,
        status: 'PUBLISHED',
        version: 0,
        createdAt: now,
        updatedAt: now,
      },
    })
  }

  const previousState = current.status as WorkflowStatus

  // ─── Step 2: Validate transition ───

  if (!isUpdateContent) {
    if (targetState === 'DRAFT' && ADMIN_DRAFT_TRANSITIONS.includes(previousState)) {
      // Admin reset to draft — always allowed
    } else {
      const allowed = ALLOWED_TRANSITIONS[previousState]
      if (!allowed || !allowed.includes(targetState)) {
        return {
          success: false,
          previousState,
          newState: null,
          version: current.version,
          transitionTime: null,
          performedBy: userId,
          error: `Cannot transition from ${WORKFLOW_STATUS_LABELS[previousState]} to ${WORKFLOW_STATUS_LABELS[targetState]}. Allowed: ${(ALLOWED_TRANSITIONS[previousState] || []).map(s => WORKFLOW_STATUS_LABELS[s]).join(', ')}`,
          httpStatus: 400,
        }
      }
    }
  }

  // ─── Step 3: Validate permission ───

  const requiredRoles = ACTION_REQUIRED_ROLES[action]
  if (!requiredRoles.includes(userRole || '')) {
    return {
      success: false,
      previousState,
      newState: null,
      version: current.version,
      transitionTime: null,
      performedBy: userId,
      error: `Insufficient permissions. Required: ${requiredRoles.join(' or ')}. Current: ${userRole || 'unknown'}`,
      httpStatus: 403,
    }
  }

  // ─── Step 4: Validate optimistic concurrency ───

  if (current.version !== expectedVersion) {
    return {
      success: false,
      previousState,
      newState: null,
      version: current.version,
      transitionTime: null,
      performedBy: userId,
      conflict: true,
      error: `This record has been modified by another administrator. Expected version ${expectedVersion}, found ${current.version}. Please refresh and try again.`,
      httpStatus: 409,
    }
  }

  // ─── Atomic Transaction ───

  try {
    const result = await db.$transaction(async (tx) => {
      // Step 5: Version History snapshot (before content update)
      let versionNumber: number | null = null
      if (isVersionableModel(entityType) && prismaModel) {
        const currentRecord = await (tx as any)[prismaModel].findUnique({
          where: { id: entityId },
        })
        if (currentRecord) {
          versionNumber = await createVersion(
            tx as any,
            entityType,
            entityId,
            currentRecord,
            userId,
            changedFields || ['status'],
            {
              changeType: 'update',
              skipAuditLog: true,
              ipAddress,
              userAgent,
            }
          )
        }
      }

      // Step 6: Content update (inside same transaction)
      let contentRecord: unknown = null
      if (contentUpdate && prismaModel) {
        const updateOptions: Record<string, unknown> = {
          where: { id: entityId },
          data: contentUpdate.data,
        }
        if (contentUpdate.include) {
          updateOptions.include = contentUpdate.include
        }
        contentRecord = await (tx as any)[prismaModel].update(updateOptions)
      }

      // Step 7: Workflow state update
      const newState = isUpdateContent ? previousState : targetState
      const workflowUpdateData: Record<string, unknown> = {
        status: newState,
        previousStatus: previousState,
        version: { increment: 1 },
        updatedAt: new Date(),
      }

      if (action === 'submit_for_review') {
        workflowUpdateData.submittedBy = userId
        workflowUpdateData.submittedAt = new Date()
      } else if (action === 'approve') {
        workflowUpdateData.reviewedBy = userId
        workflowUpdateData.reviewedAt = new Date()
        workflowUpdateData.reviewComment = comment
      } else if (action === 'reject') {
        workflowUpdateData.rejectedBy = userId
        workflowUpdateData.rejectedAt = new Date()
        workflowUpdateData.rejectionReason = comment
      } else if (action === 'publish') {
        workflowUpdateData.publishedBy = userId
        workflowUpdateData.publishedAt = new Date()
      } else if (action === 'schedule') {
        workflowUpdateData.scheduledAt = scheduledAt || new Date()
      } else if (action === 'archive') {
        workflowUpdateData.archivedBy = userId
        workflowUpdateData.archivedAt = new Date()
      }

      const updated = await tx.contentWorkflow.update({
        where: { id: current.id },
        data: workflowUpdateData,
      })

      // Step 8: WorkflowHistory
      await tx.workflowHistory.create({
        data: {
          entityType,
          entityId,
          fromStatus: previousState,
          toStatus: newState,
          performedBy: userId,
          performedByName: userName,
          performedByRole: userRole,
          comment: comment || WORKFLOW_ACTION_LABELS[action],
          versionNumber: updated.version,
          ipAddress,
          userAgent,
        },
      })

      // Step 9: AuditLog (Activity Timeline source)
      const parsedUA = parseUserAgent(userAgent)
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: ACTION_AUDIT_KEY[action],
          entityType,
          entityId,
          oldData: JSON.stringify({ status: previousState, version: current.version }),
          newData: JSON.stringify({ status: newState, version: updated.version }),
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          userName: userName || null,
          userRole: userRole || null,
          status: 'success',
          os: parsedUA.os || null,
          browser: parsedUA.browser || null,
        },
      })

      // Step 10: WorkflowComment (inside same transaction)
      if (comment && (action === 'approve' || action === 'reject')) {
        await tx.workflowComment.create({
          data: {
            entityType,
            entityId,
            authorId: userId,
            authorName: options?.workflowComment?.authorName || userId,
            authorRole: options?.workflowComment?.authorRole || userRole || null,
            content: comment,
            action,
          },
        })
      }

      return { updated, versionNumber, contentRecord }
    })

    const transitionTime = Date.now() - startTime

    return {
      success: true,
      previousState,
      newState: effectiveTargetState || previousState,
      version: result.updated.version,
      transitionTime,
      performedBy: userId,
      httpStatus: 200,
      contentRecord: result.contentRecord,
    }
  } catch (error) {
    return {
      success: false,
      previousState,
      newState: null,
      version: current.version,
      transitionTime: null,
      performedBy: userId,
      error: error instanceof Error ? error.message : 'Unknown error during transition',
      httpStatus: 500,
    }
  }
}

// ─── Query Helpers ───

export async function getWorkflow(
  db: PrismaClient,
  entityType: string,
  entityId: string
): Promise<WorkflowState | null> {
  const workflow = await db.contentWorkflow.findFirst({
    where: { entityType, entityId },
  })
  return workflow as WorkflowState | null
}

export async function getWorkflowHistory(
  db: PrismaClient,
  entityType: string,
  entityId: string
) {
  return db.workflowHistory.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
  })
}

export function isValidTransition(from: WorkflowStatus, to: WorkflowStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from]
  return allowed ? allowed.includes(to) : false
}
