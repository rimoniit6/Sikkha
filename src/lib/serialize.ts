/**
 * Serialize data for safe transfer from Server Components to Client Components.
 *
 * Prisma returns complex objects with Date instances, Decimal types, etc.
 * that cannot be directly passed to client components via props.
 *
 * This function serializes them to plain JSON-safe objects using
 * structuredClone when available (faster, handles Dates, Maps, Sets)
 * with a JSON roundtrip fallback.
 *
 * Usage:
 *   const serialized = serialize(prismaData)
 *   return <ClientComponent data={serialized} />
 */

export function serialize<T>(data: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data)
    } catch {
      // Fall through to JSON roundtrip
    }
  }
  return JSON.parse(JSON.stringify(data))
}
