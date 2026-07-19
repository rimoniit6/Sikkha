/**
 * Centralized Structured Logger
 *
 * Replaces scattered console.log/error/warn with a consistent,
 * structured logging format. Supports request context, severity levels,
 * and Sentry integration.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User logged in', { userId, requestId })
 *   logger.error('Database query failed', { error, requestId, route })
 */

// ─── Log Levels ───

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

const MIN_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL as LogLevel] ?? LOG_LEVELS.info

// ─── Structured Log Entry ───

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  requestId?: string
  userId?: string
  route?: string
  method?: string
  statusCode?: number
  duration?: number
  context?: string
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  meta?: Record<string, unknown>
}

// ─── Core Logger ───

function formatEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
  ]
  if (entry.requestId) parts.push(`[req:${entry.requestId.slice(0, 8)}]`)
  if (entry.route) parts.push(`[${entry.method || ''} ${entry.route}]`)
  if (entry.context) parts.push(`[${entry.context}]`)
  parts.push(entry.message)
  return parts.join(' ')
}

function writeLog(entry: LogEntry): void {
  if (LOG_LEVELS[entry.level] < MIN_LEVEL) return

  const formatted = formatEntry(entry)
  const meta = entry.error || entry.meta

  switch (entry.level) {
    case 'fatal':
    case 'error':
      console.error(formatted, meta ? JSON.stringify(meta, null, 0) : '')
      break
    case 'warn':
      console.warn(formatted, meta ? JSON.stringify(meta, null, 0) : '')
      break
    case 'info':
      console.log(formatted)
      break
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        console.log(formatted)
      }
      break
  }

  // Send to Sentry for errors/fatals
  if ((entry.level === 'error' || entry.level === 'fatal') && entry.error) {
    try {
      // Dynamic import to avoid circular dependency
      import('@sentry/nextjs').then(({ captureException }) => {
        const err = new Error(entry.error!.message)
        err.name = entry.error!.name
        if (entry.error!.stack) err.stack = entry.error!.stack
        captureException(err, {
          extra: {
            requestId: entry.requestId,
            userId: entry.userId,
            route: entry.route,
            method: entry.method,
            statusCode: entry.statusCode,
            context: entry.context,
            code: entry.error!.code,
          },
        })
      }).catch(() => {})
    } catch {}
  }
}

// ─── Public API ───

export interface RequestContext {
  requestId?: string
  userId?: string
  route?: string
  method?: string
}

const logger = {
  debug(message: string, meta?: Record<string, unknown>, ctx?: RequestContext) {
    writeLog({ timestamp: new Date().toISOString(), level: 'debug', message, ...ctx, meta })
  },

  info(message: string, meta?: Record<string, unknown>, ctx?: RequestContext) {
    writeLog({ timestamp: new Date().toISOString(), level: 'info', message, ...ctx, meta })
  },

  warn(message: string, meta?: Record<string, unknown>, ctx?: RequestContext) {
    writeLog({ timestamp: new Date().toISOString(), level: 'warn', message, ...ctx, meta })
  },

  error(message: string, error?: unknown, ctx?: RequestContext) {
    const errorInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error
        ? { name: 'Unknown', message: String(error) }
        : undefined
    writeLog({ timestamp: new Date().toISOString(), level: 'error', message, ...ctx, error: errorInfo as LogEntry['error'] })
  },

  fatal(message: string, error?: unknown, ctx?: RequestContext) {
    const errorInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error
        ? { name: 'Unknown', message: String(error) }
        : undefined
    writeLog({ timestamp: new Date().toISOString(), level: 'fatal', message, ...ctx, error: errorInfo as LogEntry['error'] })
  },

  /** Log an API request with duration */
  request(method: string, route: string, statusCode: number, duration: number, ctx?: RequestContext) {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    writeLog({
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${route} ${statusCode} ${duration}ms`,
      ...ctx,
      route,
      method,
      statusCode,
      duration,
    })
  },
}

export default logger
