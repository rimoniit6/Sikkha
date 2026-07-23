/**
 * Version History Service
 *
 * Centralized service for tracking content changes.
 * Creates version snapshots BEFORE updates for rollback capability.
 * Automatically creates Audit Log entries — developers should never call both.
 *
 * Usage:
 *   import { createVersion, getVersions, rollbackVersion } from '@/lib/version-history'
 *   await createVersion(db, 'lecture', lectureId, existing, userId, updateFields)
 */

// Using `any` for the db parameter because Prisma's extended client types
// are incompatible with the base PrismaClient type in interactive transactions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrismaClient = any

// ─── Types ───

export interface VersionSnapshot {
  id: string
  entityType: string
  entityId: string
  versionNumber: number
  snapshot: Record<string, unknown>
  changedFields: string[]
  changeType: 'create' | 'update' | 'restore' | 'import'
  rollbackFromVersion: number | null
  rollbackComment: string | null
  performedBy: string
  performedByName: string | null
  performedByRole: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export interface CreateVersionOptions {
  /** Skip system-managed fields from snapshot (default: true) */
  skipSystemFields?: boolean
  /** Custom change type override */
  changeType?: 'create' | 'update' | 'restore' | 'import'
  /** Rollback context */
  rollbackFromVersion?: number
  rollbackComment?: string
  /** Request context for IP/UserAgent */
  ipAddress?: string
  userAgent?: string
  /** Skip audit log creation (e.g., when called from rollbackVersion which creates its own) */
  skipAuditLog?: boolean
}

// System fields to exclude from snapshots by default
const SYSTEM_FIELDS = new Set([
  'id', 'createdAt', 'updatedAt', 'deletedAt', 'deletedBy', 'deleteReason',
])

// Fields to always include (even if in system fields list)
const ALWAYS_INCLUDE = new Set([
  'deletedAt', 'deletedBy', 'deleteReason', // Important for soft-delete state
])

// ─── Entity Type Constants ───

const ENTITY_TYPE_MAP: Record<string, string> = {
  lecture: 'lecture',
  mCQ: 'mcq',
  cQ: 'cq',
  knowledgeQuestion: 'knowledge_question',
  suggestion: 'suggestion',
  course: 'course',
  courseLesson: 'course_lesson',
  exam: 'exam',
  mCQExamPackage: 'mcq_exam_package',
  cQExamPackage: 'cq_exam_package',
  contentPackage: 'content_package',
  contentBundle: 'content_bundle',
  siteSetting: 'site_setting',
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  create: 'তৈরি',
  update: 'আপডেট',
  restore: 'পুনরুদ্ধার',
  import: 'ইমপোর্ট',
}

// ─── Core Functions ───

/**
 * Create a version snapshot of a record.
 *
 * Automatically creates:
 * - ContentVersion record (the snapshot)
 * - AuditLog entry (version_created action)
 *
 * Should be called BEFORE the update operation, inside the same transaction.
 * The snapshot captures the CURRENT state (before the update).
 *
 * @param db - Prisma client (or transaction client)
 * @param entityType - Model name (e.g., 'lecture', 'mcq')
 * @param entityId - Record ID
 * @param currentRecord - The current state of the record (before update)
 * @param userId - User performing the update
 * @param changedFields - List of fields being changed
 * @param options - Additional options
 * @returns The created version number
 */
export async function createVersion(
  db: AnyPrismaClient,
  entityType: string,
  entityId: string,
  currentRecord: Record<string, unknown>,
  userId: string,
  changedFields: string[],
  options: CreateVersionOptions = {}
): Promise<number> {
  const {
    skipSystemFields = true,
    changeType = 'update',
    rollbackFromVersion,
    rollbackComment,
    ipAddress,
    userAgent,
    skipAuditLog = false,
  } = options

  // Build snapshot (exclude system fields unless explicitly included)
  const snapshot: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(currentRecord)) {
    if (skipSystemFields && SYSTEM_FIELDS.has(key) && !ALWAYS_INCLUDE.has(key)) {
      continue
    }
    snapshot[key] = value
  }

  // Get next version number
  const lastVersion = await db.contentVersion.findFirst({
    where: { entityType, entityId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  })
  const versionNumber = (lastVersion?.versionNumber ?? 0) + 1

  // Get user info for display
  let performedByName: string | null = null
  let performedByRole: string | null = null
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true },
    })
    performedByName = user?.name || null
    performedByRole = user?.role || null
  } catch {
    // User might not exist (system action)
  }

  // Create version
  await db.contentVersion.create({
    data: {
      entityType,
      entityId,
      versionNumber,
      snapshot: JSON.stringify(snapshot),
      changedFields: JSON.stringify(changedFields),
      changeType,
      rollbackFromVersion: rollbackFromVersion || null,
      rollbackComment: rollbackComment || null,
      performedBy: userId,
      performedByName,
      performedByRole,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  })

  // Automatically create Audit Log entry (single source of truth)
  // NOTE: db is the (possibly transaction) client passed from the caller.
  // We MUST pass it as tx to createAuditLog so that when createVersion is called
  // inside a $transaction, the audit log participates in the same connection —
  // otherwise it tries to write via the global db client, which blocks on the
  // SQLite write lock held by the transaction, causing a deadlock/timeout.
  if (!skipAuditLog) {
    try {
      const { createAuditLog } = await import('@/lib/audit')
      await createAuditLog({
        adminId: userId,
        action: 'version_created',
        entityType: ENTITY_TYPE_MAP[entityType] || entityType,
        entityId,
        oldData: {
          versionNumber,
          changeType,
          changedFields,
          rollbackFromVersion: rollbackFromVersion || null,
          rollbackComment: rollbackComment || null,
        },
        newData: snapshot,
        ipAddress,
        userAgent,
        userName: performedByName || undefined,
        userRole: performedByRole || undefined,
        tx: db, // ← CRITICAL: pass transaction client to avoid deadlock
      })
    } catch {
      // Audit logging should never break the main operation
    }
  }

  return versionNumber
}

/**
 * Get all versions for a record.
 */
export async function getVersions(
  db: AnyPrismaClient,
  entityType: string,
  entityId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ versions: VersionSnapshot[]; total: number; totalPages: number }> {
  const { page = 1, limit = 20 } = options

  const where = { entityType, entityId }

  const [data, total] = await Promise.all([
    db.contentVersion.findMany({
      where,
      orderBy: { versionNumber: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.contentVersion.count({ where }),
  ])

  const versions = data.map(parseVersion)

  return {
    versions,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get the latest version for a record.
 */
export async function getLatestVersion(
  db: AnyPrismaClient,
  entityType: string,
  entityId: string
): Promise<VersionSnapshot | null> {
  const version = await db.contentVersion.findFirst({
    where: { entityType, entityId },
    orderBy: { versionNumber: 'desc' },
  })

  return version ? parseVersion(version) : null
}

/**
 * Get a specific version by number.
 */
export async function getVersionByNumber(
  db: AnyPrismaClient,
  entityType: string,
  entityId: string,
  versionNumber: number
): Promise<VersionSnapshot | null> {
  const version = await db.contentVersion.findUnique({
    where: {
      entityType_entityId_versionNumber: {
        entityType,
        entityId,
        versionNumber,
      },
    },
  })

  return version ? parseVersion(version) : null
}

/**
 * Compare two versions and return the differences.
 */
export async function compareVersions(
  db: AnyPrismaClient,
  entityType: string,
  entityId: string,
  versionA: number,
  versionB: number
): Promise<{
  versionA: VersionSnapshot | null
  versionB: VersionSnapshot | null
  differences: Array<{ field: string; oldValue: unknown; newValue: unknown }>
}> {
  const [vA, vB] = await Promise.all([
    getVersionByNumber(db, entityType, entityId, versionA),
    getVersionByNumber(db, entityType, entityId, versionB),
  ])

  const differences: Array<{ field: string; oldValue: unknown; newValue: unknown }> = []

  if (vA && vB) {
    const allFields = new Set([
      ...Object.keys(vA.snapshot),
      ...Object.keys(vB.snapshot),
    ])

    for (const field of allFields) {
      const valA = vA.snapshot[field]
      const valB = vB.snapshot[field]
      if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        differences.push({ field, oldValue: valA, newValue: valB })
      }
    }
  }

  return { versionA: vA, versionB: vB, differences }
}

/**
 * Rollback a record to a specific version.
 *
 * Everything runs inside ONE database transaction:
 * - create version of current state (pre-rollback)
 * - restore snapshot to record
 * - create version of rollback state
 * - audit log
 *
 * If ANY step fails, EVERYTHING rolls back.
 *
 * Creates a NEW version with the rolled-back state.
 * Does NOT delete old versions — history is append-only.
 *
 * @returns The new version number after rollback
 */
export async function rollbackVersion(
  db: AnyPrismaClient,
  entityType: string,
  entityId: string,
  targetVersion: number,
  userId: string,
  options: { comment?: string; ipAddress?: string; userAgent?: string } = {}
): Promise<{ success: boolean; newVersionNumber: number; error?: string }> {
  try {
    // Fetch the target version
    const targetVersionData = await getVersionByNumber(db, entityType, entityId, targetVersion)
    if (!targetVersionData) {
      return { success: false, newVersionNumber: 0, error: `Version ${targetVersion} not found` }
    }

    // Get the current version number
    const latestVersion = await getLatestVersion(db, entityType, entityId)
    const currentVersionNumber = latestVersion?.versionNumber ?? 0

    // Parse the snapshot to get the fields to restore
    const snapshot = targetVersionData.snapshot

    // Determine which fields to restore (exclude system fields)
    const updateData: Record<string, unknown> = {}
    const restoredFields: string[] = []

    for (const [key, value] of Object.entries(snapshot)) {
      if (['id', 'createdAt'].includes(key)) continue // Never restore these
      updateData[key] = value
      restoredFields.push(key)
    }

    // Get user info for audit
    let userName: string | null = null
    let userRole: string | null = null
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true },
      })
      userName = user?.name || null
      userRole = user?.role || null
    } catch {
      // User might not exist
    }

    // Everything inside ONE transaction
    const newVersionNumber = await db.$transaction(async (tx: AnyPrismaClient) => {
      // Step 1: Create version of current state BEFORE rollback
      if (latestVersion) {
        await createVersion(tx, entityType, entityId, latestVersion.snapshot, userId, restoredFields, {
          changeType: 'update',
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          skipAuditLog: true, // We'll create a single audit log at the end
        })
      }

      // Step 2: Update the record with the rolled-back state
      await tx[entityType].update({
        where: { id: entityId },
        data: updateData as any,
      })

      // Step 3: Create version of the rollback
      const rollbackVersionNum = await createVersion(tx, entityType, entityId, snapshot, userId, restoredFields, {
        changeType: 'update',
        rollbackFromVersion: currentVersionNumber,
        rollbackComment: options.comment || `Rolled back to version ${targetVersion}`,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        skipAuditLog: true, // We'll create a single audit log at the end
      })

      // Step 4: Create single audit log for the rollback (inside transaction)
      try {
        const { createAuditLog } = await import('@/lib/audit')
        await createAuditLog({
          adminId: userId,
          action: 'version_rollback',
          entityType: ENTITY_TYPE_MAP[entityType] || entityType,
          entityId,
          oldData: {
            rolledBackFromVersion: currentVersionNumber,
            rolledBackToVersion: targetVersion,
            newVersionNumber: rollbackVersionNum,
            restoredFields,
          },
          newData: snapshot,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          userName: userName || undefined,
          userRole: userRole || undefined,
          tx, // ← CRITICAL: pass transaction client to avoid deadlock
        })
      } catch {
        // Audit logging should never break the main operation
      }

      return rollbackVersionNum
    }, {
      maxWait: 15000,
      timeout: 30000,
    })

    return { success: true, newVersionNumber }
  } catch (err) {
    return {
      success: false,
      newVersionNumber: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get version statistics for a model type.
 */
export async function getVersionStats(
  db: AnyPrismaClient,
  entityType: string
): Promise<{
  totalVersions: number
  uniqueEntities: number
  latestVersionDate: Date | null
}> {
  const [totalVersions, uniqueEntities, latest] = await Promise.all([
    db.contentVersion.count({ where: { entityType } }),
    db.contentVersion.groupBy({
      by: ['entityId'],
      where: { entityType },
      _count: { entityId: true },
    }).then((groups: unknown[]) => groups.length),
    db.contentVersion.findFirst({
      where: { entityType },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ])

  return {
    totalVersions,
    uniqueEntities,
    latestVersionDate: latest?.createdAt ?? null,
  }
}

// ─── Internal Helpers ───

function parseVersion(raw: Record<string, unknown>): VersionSnapshot {
  return {
    id: raw.id as string,
    entityType: raw.entityType as string,
    entityId: raw.entityId as string,
    versionNumber: raw.versionNumber as number,
    snapshot: typeof raw.snapshot === 'string' ? JSON.parse(raw.snapshot) : raw.snapshot as Record<string, unknown>,
    changedFields: typeof raw.changedFields === 'string' ? JSON.parse(raw.changedFields) : (raw.changedFields as string[]) || [],
    changeType: raw.changeType as VersionSnapshot['changeType'],
    rollbackFromVersion: raw.rollbackFromVersion as number | null,
    rollbackComment: raw.rollbackComment as string | null,
    performedBy: raw.performedBy as string,
    performedByName: raw.performedByName as string | null,
    performedByRole: raw.performedByRole as string | null,
    ipAddress: raw.ipAddress as string | null,
    userAgent: raw.userAgent as string | null,
    createdAt: raw.createdAt as Date,
  }
}

// ─── Entity Type Constants for Version History ───

export const VERSIONABLE_MODELS = new Set([
  'lecture',
  'mCQ',
  'cQ',
  'knowledgeQuestion',
  'suggestion',
  'course',
  'courseLesson',
  'exam',
  'mCQExamPackage',
  'cQExamPackage',
  'contentPackage',
  'contentBundle',
  'siteSetting',
])

export function isVersionableModel(model: string): boolean {
  return VERSIONABLE_MODELS.has(model)
}
