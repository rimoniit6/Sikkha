import { getExamTimeMs } from '@/lib/date-utils'

export interface TimeWindow {
  windowOpen: boolean
  windowExpired: boolean
  nowMs: number
  examStartMs: number
  effectiveEndMs: number
}

export function getExamTimeWindow(set: {
  scheduledDate?: Date | null
  startTime?: string | null
  endTime?: string | null
}): TimeWindow {
  const nowMs = Date.now()
  if (!set.scheduledDate) {
    return { windowOpen: true, windowExpired: false, nowMs, examStartMs: 0, effectiveEndMs: Infinity }
  }
  const examStartMs = getExamTimeMs(set.scheduledDate, set.startTime || '00:00')
  const examEndMs = getExamTimeMs(set.scheduledDate, set.endTime || '23:59')
  const effectiveEndMs = examEndMs <= examStartMs ? examEndMs + 24 * 60 * 60 * 1000 : examEndMs
  return {
    windowOpen: nowMs >= examStartMs,
    windowExpired: nowMs > effectiveEndMs,
    nowMs,
    examStartMs,
    effectiveEndMs,
  }
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function calculateTimeRemaining(startedAt: Date | null, durationMinutes: number): number {
  if (!startedAt) return durationMinutes * 60
  const endTimeMs = startedAt.getTime() + durationMinutes * 60 * 1000
  const remainingMs = endTimeMs - Date.now()
  return Math.max(0, Math.floor(remainingMs / 1000))
}
