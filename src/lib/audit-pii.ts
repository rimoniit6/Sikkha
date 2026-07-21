/**
 * Audit PII Sanitization
 *
 * Strips/obfuscates known sensitive fields from audit log data
 * before storage. Applied automatically in createAuditLog and
 * createBatchAuditLogs — callers don't need to modify their code.
 *
 * Usage:
 *   import { sanitizeAuditData } from '@/lib/audit-pii'
 *   const safe = sanitizeAuditData(rawData)
 */

/**
 * Set of field names that contain sensitive Personally Identifiable
 * Information (PII) or secrets. When any of these keys appears in
 * audit log oldData/newData, its value is replaced with '[REDACTED]'.
 *
 * This list focuses on fields that commonly appear in request bodies
 * passed to admin CRUD routes as oldData or newData.
 */
export const PII_FIELDS = new Set([
  // Authentication credentials
  'password',
  'passwordHash',
  'password_hash',
  'currentPassword',
  'newPassword',

  // Tokens & secrets
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'refreshToken',

  // Contact information
  'email',
  'phone',
  'phoneNumber',
  'phone_number',
  'mobile',

  // Address
  'address',
  'street',
  'city',
  'postalCode',

  // Financial
  'cardNumber',
  'card_number',
  'cvv',
  'bankAccount',
])

/**
 * Sanitize audit data by redacting known PII fields.
 *
 * Returns a NEW object — the original input is never mutated.
 * Arrays and primitive values that don't match PII keys are kept as-is.
 * Empty objects after sanitization are returned as-is.
 *
 * @param data - The raw data object to sanitize (e.g., a request body)
 * @returns A new object with PII field values replaced by '[REDACTED]'
 */
export function sanitizeAuditData(
  data: Record<string, unknown> | undefined | null
): Record<string, unknown> | null {
  if (!data) return null

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (PII_FIELDS.has(key)) {
      sanitized[key] = '[REDACTED]'
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      // Recursively sanitize nested objects (e.g., user.profile.email)
      sanitized[key] = sanitizeAuditData(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}
