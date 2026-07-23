/**
 * Centralized file URL resolver.
 *
 * - Relative paths (e.g. `/uploads/file.jpg`) are returned as-is for
 *   compatibility with Next.js <Image> (avoids remotePatterns checks).
 * - Absolute URLs (http/https) are returned unchanged.
 * - Legacy absolute localhost URLs are normalized back to relative paths.
 *
 * Usage:
 *   getFileUrl('/uploads/abc.jpg')          → '/uploads/abc.jpg'
 *   getFileUrl('https://cdn.com/img.jpg')   → 'https://cdn.com/img.jpg'
 *   getFileUrl(null)                         → ''
 *   getFileUrl('')                            → ''
 */

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#f1f5f9" width="400" height="300"/>
      <text x="200" y="145" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">ছবি লোড হয়নি</text>
    </svg>`,
  )

/**
 * Extract the pathname from an absolute URL that points to localhost.
 * Handles legacy records where the upload API stored absolute URLs
 * like `http://localhost:3000/uploads/file.jpg`.
 */
function normalizeLocalhostUrl(path: string): string | null {
  try {
    const parsed = new URL(path)
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0'
    ) {
      return parsed.pathname + parsed.search
    }
  } catch {
    // Not a valid URL — return null to fall through
  }
  return null
}

/**
 * Resolve a file path to an absolute URL.
 * - If already absolute (http/https) and NOT localhost, returns as-is.
 * - If absolute but points to localhost, strips the origin and re-resolves.
 * - If relative (e.g. /uploads/file.jpg), prepends the base URL.
 * - If null/undefined/empty, returns ''.
 */
export function getFileUrl(path: string | null | undefined): string {
  if (!path) return ''
  // Normalize absolute localhost URLs back to relative paths
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const normalized = normalizeLocalhostUrl(path)
    // Return relative path — Next.js <Image> doesn't need absolute URLs
    // for same-origin images, and relative paths avoid remotePatterns checks.
    if (normalized !== null) {
      return normalized
    }
    return path
  }
  // Handle protocol-relative URLs (//cdn.com/file.jpg)
  if (path.startsWith('//')) return `https:${path}`
  // Return relative path as-is — the browser resolves it against the current origin.
  // Do NOT prepend the base URL: Next.js <Image> checks remotePatterns for absolute
  // URLs, and production domains are not listed there. Relative paths bypass this
  // check entirely and work identically in dev, preview, and production.
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized
}

/**
 * Returns a data-URI placeholder for broken/missing images.
 */
export function getImagePlaceholder(): string {
  return PLACEHOLDER
}
