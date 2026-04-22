/**
 * Logger helper for Edge Functions
 * Per API_FUNCTIONS.md: _shared/logger.ts
 */
export function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  switch (level) {
    case 'error':
      console.error(JSON.stringify(entry))
      break
    case 'warn':
      console.warn(JSON.stringify(entry))
      break
    default:
      console.log(JSON.stringify(entry))
  }
}
