/**
 * Git-style Content Diff Engine (Enhanced)
 *
 * Compares two version snapshots and produces a structured diff.
 * Generic — no model-specific logic.
 *
 * Features:
 * - Added/Removed/Updated field detection
 * - Array identity changes (added/removed/reordered items)
 * - Change severity classification (LOW/MEDIUM/HIGH/CRITICAL)
 * - Human-readable summary generation
 * - Image/file/URL classification
 * - Configurable ignored fields
 * - Large value truncation for preview
 * - Rich text whitespace normalization
 * - Nested object path tracking
 */

// ─── Types ───

export type ChangeType = 'ADDED' | 'REMOVED' | 'UPDATED'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type FileType = 'image' | 'video' | 'pdf' | 'document' | 'generic_url'

export interface FieldChange {
  fieldPath: string
  changeType: ChangeType
  oldValue: unknown
  newValue: unknown
  label: string
  severity: Severity
  fileType?: FileType
  truncated?: boolean
}

export interface DiffResult {
  changes: FieldChange[]
  summary: ChangeSummary
  readableSummary: string
  snapshotA: Record<string, unknown> | null
  snapshotB: Record<string, unknown> | null
}

export interface ChangeSummary {
  totalFields: number
  added: number
  removed: number
  updated: number
  reordered: number
  bySeverity: { low: number; medium: number; high: number; critical: number }
  byFileType: { image: number; video: number; pdf: number; document: number; generic_url: number }
}

export interface DiffOptions {
  ignoredFields?: string[]
  maxPreviewLength?: number
}

// ─── Constants ───

const FIELD_LABELS: Record<string, string> = {
  title: 'শিরোনাম', slug: 'স্লাগ', description: 'বিবরণ', content: 'বিষয়বস্তু',
  price: 'মূল্য', originalPrice: 'আসল মূল্য', isPremium: 'প্রিমিয়াম', isActive: 'সক্রিয়',
  order: 'অর্ডার', duration: 'সময়কাল', thumbnail: 'থাম্বনেইল',
  videoUrl: 'ভিডিও URL', audioUrl: 'অডিও URL', pdfUrl: 'PDF URL',
  status: 'স্ট্যাটাস', type: 'ধরন', difficulty: 'কঠিনতা',
  board: 'বোর্ড', year: 'সাল', topic: 'টপিক', tags: 'ট্যাগ',
  classLevel: 'শ্রেণি', subjectId: 'বিষয়', chapterId: 'অধ্যায়', courseId: 'কোর্স',
  correctAnswer: 'সঠিক উত্তর', explanation: 'ব্যাখ্যা', question: 'প্রশ্ন',
  questionImage: 'প্রশ্ন ছবি', optionA: 'অপশন A', optionB: 'অপশন B',
  optionC: 'অপশন C', optionD: 'অপশন D', uddeepok: 'উদ্দীপক',
  answer1: 'উত্তর ১', answer2: 'উত্তর ২', answer3: 'উত্তর ৩', answer4: 'উত্তর ৪',
  question1: 'প্রশ্ন ১', question2: 'প্রশ্ন ২', question3: 'প্রশ্ন ৩', question4: 'প্রশ্ন ৪',
  subjectIds: 'বিষয় আইডি', totalSets: 'মোট সেট', durationLabel: 'সময়কাল লেবেল',
  value: 'মান', group: 'গ্রুপ', label: 'লেবেল', key: 'কী',
  features: 'বৈশিষ্ট্য', requirements: 'প্রয়োজনীয়তা', targetStudents: 'লক্ষ্য শিক্ষার্থী',
  teacherName: 'শিক্ষকের নাম', hasCertificate: 'সার্টিফিকেট', language: 'ভাষা',
}

// ─── Severity Rules ───

const SEVERITY_MAP: Record<string, Severity> = {
  slug: 'CRITICAL',
  classId: 'CRITICAL',
  subjectId: 'CRITICAL',
  chapterId: 'CRITICAL',
  courseId: 'CRITICAL',
  permissions: 'CRITICAL',
  role: 'CRITICAL',
  price: 'HIGH',
  originalPrice: 'HIGH',
  status: 'HIGH',
  isActive: 'HIGH',
  isPremium: 'HIGH',
  title: 'LOW',
  description: 'LOW',
  content: 'LOW',
  explanation: 'LOW',
  tags: 'LOW',
  topic: 'LOW',
  difficulty: 'LOW',
  order: 'LOW',
  duration: 'LOW',
  thumbnail: 'MEDIUM',
  videoUrl: 'MEDIUM',
  audioUrl: 'MEDIUM',
  pdfUrl: 'MEDIUM',
}

// System fields to exclude from diff output
const EXCLUDED_FIELDS = new Set([
  'id', 'createdAt', 'updatedAt', 'deletedAt', 'deletedBy', 'deleteReason',
  'password', // Never expose
])

// ─── File Type Detection ───

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv']
const PDF_EXTENSIONS = ['.pdf']
const DOCUMENT_EXTENSIONS = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv']

function classifyValueFileType(value: unknown): FileType | undefined {
  if (typeof value !== 'string') return undefined
  return classifyFileType(value)
}

function classifyFileType(value: string): FileType | undefined {
  const lower = value.toLowerCase()
  if (IMAGE_EXTENSIONS.some(ext => lower.includes(ext))) return 'image'
  if (lower.includes('utfs.io') || lower.includes('uploadthing')) {
    // UploadThing URLs - check for image patterns
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) return 'image'
    if (lower.match(/\.(mp4|webm|mov)/)) return 'video'
    if (lower.match(/\.pdf/)) return 'pdf'
  }
  if (VIDEO_EXTENSIONS.some(ext => lower.includes(ext))) return 'video'
  if (PDF_EXTENSIONS.some(ext => lower.includes(ext))) return 'pdf'
  if (DOCUMENT_EXTENSIONS.some(ext => lower.includes(ext))) return 'document'
  if (lower.startsWith('http://') || lower.startsWith('https://')) return 'generic_url'
  return undefined
}

// ─── Large Value Protection ───

const DEFAULT_MAX_PREVIEW_LENGTH = 200

function truncateForPreview(value: unknown, maxLength: number): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string' && value.length > maxLength) {
    return value.substring(0, maxLength) + `... (${value.length} chars)`
  }
  if (Array.isArray(value) && value.length > 10) {
    return `[${value.length} items]`
  }
  if (typeof value === 'object' && value !== null) {
    const str = JSON.stringify(value)
    if (str.length > maxLength) {
      return `[Object: ${str.length} chars]`
    }
  }
  return value
}

// ─── Core Diff Engine ───

export function computeDiff(
  snapshotA: Record<string, unknown> | null,
  snapshotB: Record<string, unknown> | null,
  options: DiffOptions = {}
): DiffResult {
  const a = snapshotA || {}
  const b = snapshotB || {}
  const ignoredFields = new Set(options.ignoredFields || [])
  const maxPreview = options.maxPreviewLength || DEFAULT_MAX_PREVIEW_LENGTH

  const changes: FieldChange[] = []
  let added = 0
  let removed = 0
  let updated = 0
  let reordered = 0
  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 }
  const byFileType = { image: 0, video: 0, pdf: 0, document: 0, generic_url: 0 }

  const allFields = new Set([...Object.keys(a), ...Object.keys(b)])

  for (const field of allFields) {
    if (EXCLUDED_FIELDS.has(field) || ignoredFields.has(field)) continue

    const valA = a[field]
    const valB = b[field]
    const label = FIELD_LABELS[field] || field
    const severity = SEVERITY_MAP[field] || 'LOW'

    if (valA === undefined && valB !== undefined) {
      const fileType = classifyValueFileType(valB)
      changes.push({ fieldPath: field, changeType: 'ADDED', oldValue: undefined, newValue: truncateForPreview(valB, maxPreview), label, severity, fileType, truncated: typeof valB === 'string' && valB.length > maxPreview })
      added++
      bySeverity[severity.toLowerCase() as keyof typeof bySeverity]++
      if (fileType) byFileType[fileType]++
    } else if (valA !== undefined && valB === undefined) {
      const fileType = classifyValueFileType(valA)
      changes.push({ fieldPath: field, changeType: 'REMOVED', oldValue: truncateForPreview(valA, maxPreview), newValue: undefined, label, severity, fileType, truncated: typeof valA === 'string' && valA.length > maxPreview })
      removed++
      bySeverity[severity.toLowerCase() as keyof typeof bySeverity]++
      if (fileType) byFileType[fileType]++
    } else if (valA !== undefined && valB !== undefined) {
      const fieldChanges = compareValues(field, valA, valB, label, severity, maxPreview)
      for (const c of fieldChanges) {
        changes.push(c)
        if (c.changeType === 'UPDATED') updated++
        if (c.changeType === 'UPDATED' && c.fieldPath === field) {
          bySeverity[c.severity.toLowerCase() as keyof typeof bySeverity]++
          if (c.fileType) byFileType[c.fileType]++
        }
      }
    }
  }

  const summary: ChangeSummary = {
    totalFields: changes.length,
    added,
    removed,
    updated,
    reordered,
    bySeverity,
    byFileType,
  }

  return {
    changes,
    summary,
    readableSummary: generateReadableSummary(summary, changes),
    snapshotA: snapshotA,
    snapshotB: snapshotB,
  }
}

// ─── Value Comparison ───

function compareValues(fieldPath: string, valA: unknown, valB: unknown, label: string, severity: Severity, maxPreview: number): FieldChange[] {
  const changes: FieldChange[] = []

  if (valA === null && valB === null) return changes
  if (valA === null || valB === null) {
    const fileType = classifyValueFileType(valB || valA)
    changes.push({ fieldPath, changeType: 'UPDATED', oldValue: valA, newValue: valB, label, severity, fileType })
    return changes
  }

  if (typeof valA !== typeof valB) {
    const fileType = classifyValueFileType(valB)
    changes.push({ fieldPath, changeType: 'UPDATED', oldValue: valA, newValue: valB, label, severity, fileType })
    return changes
  }

  if (typeof valA === 'string' && typeof valB === 'string') {
    return compareStrings(fieldPath, valA, valB, label, severity, maxPreview)
  }

  if (typeof valA === 'number' && typeof valB === 'number') {
    if (valA !== valB) {
      changes.push({ fieldPath, changeType: 'UPDATED', oldValue: valA, newValue: valB, label, severity })
    }
    return changes
  }

  if (typeof valA === 'boolean' && typeof valB === 'boolean') {
    if (valA !== valB) {
      changes.push({ fieldPath, changeType: 'UPDATED', oldValue: valA, newValue: valB, label, severity })
    }
    return changes
  }

  if (Array.isArray(valA) && Array.isArray(valB)) {
    return compareArrays(fieldPath, valA, valB, label, severity, maxPreview)
  }

  if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null && !Array.isArray(valA) && !Array.isArray(valB)) {
    return compareObjects(fieldPath, valA as Record<string, unknown>, valB as Record<string, unknown>, label, severity, maxPreview)
  }

  if (JSON.stringify(valA) !== JSON.stringify(valB)) {
    changes.push({ fieldPath, changeType: 'UPDATED', oldValue: valA, newValue: valB, label, severity })
  }

  return changes
}

// ─── String Comparison ───

function compareStrings(fieldPath: string, valA: string, valB: string, label: string, severity: Severity, maxPreview: number): FieldChange[] {
  if (isRichText(valA) || isRichText(valB)) {
    if (normalizeRichText(valA) === normalizeRichText(valB)) return []
  }

  if (valA !== valB) {
    const fileType = classifyFileType(valA) || classifyFileType(valB)
    return [{ fieldPath, changeType: 'UPDATED', oldValue: truncateForPreview(valA, maxPreview), newValue: truncateForPreview(valB, maxPreview), label, severity, fileType, truncated: valA.length > maxPreview || valB.length > maxPreview }]
  }

  return []
}

function isRichText(value: string): boolean {
  return value.includes('<') && value.includes('>')
}

function normalizeRichText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// ─── Array Comparison ───

function compareArrays(fieldPath: string, arrA: unknown[], arrB: unknown[], label: string, severity: Severity, maxPreview: number): FieldChange[] {
  const changes: FieldChange[] = []

  const aSet = new Set(arrA.map(item => JSON.stringify(item)))
  const bSet = new Set(arrB.map(item => JSON.stringify(item)))

  // Detect reordering (same items, different order)
  if (aSet.size === bSet.size && arrA.length === arrB.length) {
    const sameItems = [...aSet].every(item => bSet.has(item))
    if (sameItems) {
      const orderChanged = arrA.some((item, i) => JSON.stringify(item) !== JSON.stringify(arrB[i]))
      if (orderChanged) {
        changes.push({
          fieldPath,
          changeType: 'UPDATED',
          oldValue: truncateForPreview(arrA, maxPreview),
          newValue: truncateForPreview(arrB, maxPreview),
          label: `${label} (পুনর্বিন্যাস)`,
          severity,
        })
      }
      return changes
    }
  }

  // Detect removed items (in A but not in B)
  for (const item of arrA) {
    if (!bSet.has(JSON.stringify(item))) {
      changes.push({
        fieldPath: `${fieldPath}[-]`,
        changeType: 'REMOVED',
        oldValue: truncateForPreview(item, maxPreview),
        newValue: undefined,
        label: `${label} (সরানো)`,
        severity,
      })
    }
  }

  // Detect added items (in B but not in A)
  for (const item of arrB) {
    if (!aSet.has(JSON.stringify(item))) {
      changes.push({
        fieldPath: `${fieldPath}[+]`,
        changeType: 'ADDED',
        oldValue: undefined,
        newValue: truncateForPreview(item, maxPreview),
        label: `${label} (যোগ)`,
        severity,
      })
    }
  }

  return changes
}

// ─── Object Comparison ───

function compareObjects(fieldPath: string, objA: Record<string, unknown>, objB: Record<string, unknown>, label: string, severity: Severity, maxPreview: number): FieldChange[] {
  const changes: FieldChange[] = []
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)])

  for (const key of allKeys) {
    const childPath = `${fieldPath}.${key}`
    const childLabel = FIELD_LABELS[key] || key
    const valA = objA[key]
    const valB = objB[key]

    if (valA === undefined && valB !== undefined) {
      changes.push({ fieldPath: childPath, changeType: 'ADDED', oldValue: undefined, newValue: valB, label: childLabel, severity })
    } else if (valA !== undefined && valB === undefined) {
      changes.push({ fieldPath: childPath, changeType: 'REMOVED', oldValue: valA, newValue: undefined, label: childLabel, severity })
    } else if (JSON.stringify(valA) !== JSON.stringify(valB)) {
      if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null) {
        changes.push(...compareObjects(childPath, valA as Record<string, unknown>, valB as Record<string, unknown>, childLabel, severity, maxPreview))
      } else {
        changes.push({ fieldPath: childPath, changeType: 'UPDATED', oldValue: valA, newValue: valB, label: childLabel, severity })
      }
    }
  }

  return changes
}

// ─── Readable Summary ───

function generateReadableSummary(summary: ChangeSummary, changes: FieldChange[]): string {
  const parts: string[] = []

  if (summary.totalFields === 0) return 'কোনো পরিবর্তন নেই'

  parts.push(`${summary.totalFields}টি ফিল্ড পরিবর্তিত হয়েছে`)

  // Group updated changes by meaningful labels
  const updatedChanges = changes.filter(c => c.changeType === 'UPDATED')
  const labels = updatedChanges.map(c => c.label)
  const uniqueLabels = [...new Set(labels)].slice(0, 5)
  if (uniqueLabels.length > 0) {
    parts.push(`${uniqueLabels.join(', ')} আপডেট হয়েছে`)
  }

  // Count file changes by type
  const imageChanges = changes.filter(c => c.fileType === 'image')
  if (imageChanges.length > 0) parts.push(`${imageChanges.length}টি ছবি পরিবর্তিত`)

  const videoChanges = changes.filter(c => c.fileType === 'video')
  if (videoChanges.length > 0) parts.push(`${videoChanges.length}টি ভিডিও পরিবর্তিত`)

  // Add/Remove summary
  if (summary.added > 0) parts.push(`${summary.added}টি যোগ`)
  if (summary.removed > 0) parts.push(`${summary.removed}টি সরানো`)
  if (summary.reordered > 0) parts.push(`${summary.reordered}টি পুনর্বিন্যাস্ত`)

  return parts.join('। ')
}

// ─── Bulk Diff ───

export interface BulkDiffResult {
  diffs: Array<{
    versionA: number
    versionB: number
    diff: DiffResult
  }>
  summary: {
    totalComparisons: number
    totalChanges: number
    fieldsChanged: Set<string>
  }
}

export function computeBulkDiff(
  versions: Array<{ versionNumber: number; snapshot: Record<string, unknown> }>
): BulkDiffResult {
  const diffs: BulkDiffResult['diffs'] = []
  const allChangedFields = new Set<string>()
  let totalChanges = 0

  for (let i = 1; i < versions.length; i++) {
    const vA = versions[i - 1]
    const vB = versions[i]
    const diff = computeDiff(vA.snapshot, vB.snapshot)
    diffs.push({ versionA: vA.versionNumber, versionB: vB.versionNumber, diff })
    for (const change of diff.changes) allChangedFields.add(change.fieldPath)
    totalChanges += diff.summary.totalFields
  }

  return { diffs, summary: { totalComparisons: diffs.length, totalChanges, fieldsChanged: allChangedFields } }
}

// ─── Change Summary ───

export function summarizeChanges(changes: FieldChange[]): {
  byType: { added: FieldChange[]; removed: FieldChange[]; updated: FieldChange[] }
  totalAdded: number
  totalRemoved: number
  totalUpdated: number
} {
  const added = changes.filter(c => c.changeType === 'ADDED')
  const removed = changes.filter(c => c.changeType === 'REMOVED')
  const updated = changes.filter(c => c.changeType === 'UPDATED')
  return { byType: { added, removed, updated }, totalAdded: added.length, totalRemoved: removed.length, totalUpdated: updated.length }
}

// ─── Exports ───

export { FIELD_LABELS, EXCLUDED_FIELDS, SEVERITY_MAP, classifyFileType }
