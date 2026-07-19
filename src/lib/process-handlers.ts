/**
 * Process Error Handlers
 *
 * Catches uncaught exceptions and unhandled promise rejections
 * that would otherwise crash the server silently.
 *
 * Import this module early in the application lifecycle
 * (e.g., in instrumentation.ts).
 */

import logger from './logger'

let initialized = false

export function initProcessHandlers(): void {
  if (initialized) return
  initialized = true

  process.on('uncaughtException', (error: Error) => {
    logger.fatal('Uncaught Exception — process will exit', error, {
      context: 'process-handler',
    })
    // Give logger time to flush before exiting
    setTimeout(() => process.exit(1), 1000)
  })

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    logger.error('Unhandled Promise Rejection', error, {
      context: 'process-handler',
    })
  })

  process.on('warning', (warning: Error) => {
    logger.warn(`Process warning: ${warning.message}`, { name: warning.name }, {
      context: 'process-handler',
    })
  })

  logger.info('Process error handlers initialized', { context: 'process-handler' })
}
