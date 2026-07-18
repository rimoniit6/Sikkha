/**
 * Premium Access — Single Source of Truth
 *
 * This module provides the canonical logic for determining whether content
 * is premium. Every Create, Update, Duplicate, Import, Seed, and Bulk
 * operation MUST use these functions to derive `isPremium`.
 *
 * RULE: isPremium is ALWAYS derived from price.
 *   - price > 0  → isPremium = true
 *   - price ≤ 0  → isPremium = false
 *
 * Never set isPremium manually. Never accept isPremium from user input.
 */

/**
 * Derive premium status from a price value.
 * This is the SINGLE source of truth for all premium calculations.
 *
 * @param price - The price of the content item (any type that can be converted to number)
 * @returns true if price > 0, false otherwise
 */
export function deriveIsPremium(price: unknown): boolean {
  if (price === null || price === undefined || price === '') return false
  if (typeof price === 'boolean') return price
  if (typeof price === 'number') return price > 0
  if (typeof price === 'string') {
    const num = parseFloat(price)
    return !isNaN(num) && num > 0
  }
  return false
}

/**
 * Build a Prisma update payload that correctly derives isPremium from price.
 * Use this in ALL update operations where price can change.
 *
 * @param incomingData - The raw update data from the request body
 * @returns The sanitized update data with isPremium derived from price
 */
export function buildPremiumUpdatePayload(
  incomingData: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  // Copy all incoming fields
  for (const [key, value] of Object.entries(incomingData)) {
    if (value !== undefined) {
      payload[key] = value
    }
  }

  // If price is being changed, derive isPremium from it
  if (incomingData.price !== undefined) {
    payload.isPremium = deriveIsPremium(incomingData.price)
  }

  return payload
}

/**
 * Build a Prisma create payload that correctly derives isPremium from price.
 * Use this in ALL create operations.
 *
 * @param data - The raw create data from the request body
 * @returns The sanitized create data with isPremium derived from price
 */
export function buildPremiumCreatePayload(
  data: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...data }

  // Always derive isPremium from price on creation
  payload.isPremium = deriveIsPremium(data.price)

  return payload
}
