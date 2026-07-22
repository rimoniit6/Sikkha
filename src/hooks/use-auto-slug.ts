'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { slugify } from '@/lib/slug'

/**
 * useAutoSlug — React hook for live slug generation.
 *
 * Automatically generates a slug from a source text (e.g., title) and
 * stops auto-syncing when the user manually edits the slug field.
 * Provides a `reset` function to re-enable auto-sync.
 *
 * @param sourceText  — The text to derive the slug from (e.g., title, name).
 * @param initialSlug — Initial slug value (e.g., from edit mode).
 *
 * @returns { slug, isManuallyEdited, setSlug, reset }
 *
 * @example
 *   const { slug, isManuallyEdited, setSlug, reset } = useAutoSlug(title)
 *
 *   // slug auto-updates as title changes
 *   // when user types in slug field, call setSlug(value)
 *   // user can click "Reset" to call reset() — re-syncs from title
 */
export function useAutoSlug(sourceText: string, initialSlug?: string) {
  const [slug, setSlugState] = useState(initialSlug ?? slugify(sourceText))
  const [isManuallyEdited, setIsManuallyEdited] = useState(false)
  const hasSetInitial = useRef(false)

  // Set initial slug once when initialSlug changes (edit mode loads data)
  useEffect(() => {
    if (initialSlug !== undefined && !hasSetInitial.current) {
      setSlugState(initialSlug)
      setIsManuallyEdited(false)
      hasSetInitial.current = true
    }
  }, [initialSlug])

  // Auto-sync slug from sourceText when it hasn't been manually edited
  useEffect(() => {
    if (!isManuallyEdited && sourceText) {
      const generated = slugify(sourceText)
      if (generated !== slug) {
        setSlugState(generated)
      }
    }
  }, [sourceText, isManuallyEdited, slug])

  const setSlug = useCallback((value: string) => {
    setIsManuallyEdited(true)
    setSlugState(value)
  }, [])

  const reset = useCallback(() => {
    setIsManuallyEdited(false)
    setSlugState(slugify(sourceText))
  }, [sourceText])

  return { slug, isManuallyEdited, setSlug, reset }
}
