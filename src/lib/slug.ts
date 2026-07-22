/**
 * Shared slug utility — safe for both server and client.
 *
 * Provides:
 *   - slugify(text)        — pure slug generation from any text
 *   - isSlug(value)        — validate slug format
 *   - normalizeSlug(value) — strip/clean a slug
 *
 * Bengali transliteration uses a character-level map so titles like
 * "বাংলাদেশের ইতিহাস" produce "bangladesher-itihash" rather than
 * keeping raw Unicode characters that make URLs unreadable.
 *
 * Backend uniqueness checking should use `findSlugConflict` / `generateUniqueSlug`
 * from @/lib/slug-unique. Frontend editors should import slugify from here
 * rather than duplicating the logic inline.
 */

// ─── Bengali → Latin Transliteration Map ─────────────────────────
// Character-level mapping for Bengali script to Latin equivalents.
// Covers vowels, consonants, common conjuncts, and dependent signs.

const BENGALI_MAP: Record<string, string> = {
  // Vowels
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
  'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',

  // Consonants
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's',
  'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',

  // Dependent vowel signs (combined with consonant)
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u',
  'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',

  // Special symbols
  'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
}

// ─── Slugify ─────────────────────────────────────────────────────

/**
 * Convert any text (Bengali, English, or mixed) to a URL-safe slug.
 *
 * Steps:
 * 1. Transliterate Bengali characters to Latin via mapping
 * 2. Normalize Unicode decomposition (NFKD)
 * 3. Remove diacritical marks
 * 4. Lowercase, replace whitespace/separators with hyphens
 * 5. Strip invalid characters
 * 6. Collapse consecutive hyphens
 * 7. Trim leading/trailing hyphens
 *
 * @example
 *   slugify('বাংলাদেশের ইতিহাস')        // 'bangladesher-itihash'
 *   slugify('SSC ICT Chapter 1')      // 'ssc-ict-chapter-1'
 *   slugify('  Hello  World!!  ')     // 'hello-world'
 */
export function slugify(text: string): string {
  if (!text) return 'untitled'

  let result = text.trim()

  // Step 1: Transliterate Bengali characters
  result = transliterateBengali(result)

  // Step 2: Unicode normalize (NFKD decomposes special chars)
  result = result.normalize('NFKD')

  // Step 3: Remove combining diacritical marks
  result = result.replace(/[\u0300-\u036f]/g, '')

  // Step 4: Lowercase
  result = result.toLowerCase()

  // Step 5: Replace any sequence of non-alphanumeric characters with a hyphen
  result = result.replace(/[^a-z0-9]+/g, '-')

  // Step 6: Collapse consecutive hyphens (already handled by step 5 but belt-and-suspenders)
  result = result.replace(/-+/g, '-')

  // Step 7: Trim leading / trailing hyphens
  result = result.replace(/^-+|-+$/g, '')

  return result || 'untitled'
}

function transliterateBengali(text: string): string {
  let result = ''
  let i = 0

  while (i < text.length) {
    const char = text[i]
    const code = char.charCodeAt(0)

    // Bengali Unicode block: U+0980 – U+09FF
    if (code >= 0x0980 && code <= 0x09FF) {
      // Check for combined characters (consonant + vowel sign)
      // A consonant followed by a vowel sign: transliterate consonant, then vowel sign
      if (isBengaliConsonant(code) && i + 1 < text.length) {
        const nextCode = text[i + 1].charCodeAt(0)
        if (isBengaliVowelSign(nextCode)) {
          // Has_horizontal_form (has_kar) — transliterate consonant then vowel sign
          result += (BENGALI_MAP[char] || '') + (BENGALI_MAP[text[i + 1]] || '')
          i += 2
          continue
        }
      }

      // No vowel sign (hoshonto) - just the consonant with implicit 'o' or standalone
      result += BENGALI_MAP[char] || ''
    } else if (code >= 0x09E6 && code <= 0x09EF) {
      // Bengali numerals (০-৯) → Arabic numerals (0-9)
      const digit = code - 0x09E6
      result += String(digit)
    } else {
      // Non-Bengali character: keep as-is
      result += char
    }

    i++
  }

  return result
}

function isBengaliConsonant(code: number): boolean {
  // Consonants are in range U+0995 to U+09B9 (ক to হ) + extras
  return (code >= 0x0995 && code <= 0x09B9) ||
         (code >= 0x09DC && code <= 0x09DF) // ড়, ঢ়, য়
}

function isBengaliVowelSign(code: number): boolean {
  // Vowel signs in Bengali Unicode block:
  //   09BE (া), 09BF (ি), 09C0 (ী), 09C1 (ু), 09C2 (ূ), 09C3 (ৃ), 09C4 (ৄ)
  //   09C7 (ে), 09C8 (ৈ)
  //   09CB (ো), 09CC (ৌ)
  return (
    (code >= 0x09BE && code <= 0x09C4) ||
    (code >= 0x09C7 && code <= 0x09C8) ||
    (code >= 0x09CB && code <= 0x09CC)
  )
}

// ─── Validation ──────────────────────────────────────────────────

/**
 * Check whether a value is a valid slug format.
 * Allows: lowercase letters, digits, hyphens.
 * Slug must not be empty, must not start/end with hyphen.
 */
export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
}

/**
 * Normalize a raw slug input (from user typing) into a clean slug.
 * Less aggressive than slugify — preserves user edits but cleans obvious issues.
 */
export function normalizeSlug(value: string): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')  // Only keep letters, digits, hyphens
    .replace(/-+/g, '-')          // Collapse consecutive hyphens
    .replace(/^-|-$/g, '')        // Trim leading/trailing hyphens
}

// ─── Preview helpers ─────────────────────────────────────────────

/**
 * Generate a preview URL path from a slug.
 */
export function slugPreviewPath(slug: string, prefix = 'blog'): string {
  return `/${prefix}/${slug}`
}
