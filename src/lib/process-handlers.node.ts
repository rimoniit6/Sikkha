import logger from './logger'

let initialized = false

export function registerProcessHandlers(): void {
  if (initialized) return
  initialized = true

  process.on('uncaughtException', (error: Error) => {
    logger.fatal('Uncaught Exception — process will exit', error, {
      context: 'process-handler',
    })
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
