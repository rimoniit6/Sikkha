'use client'

import SlugField from '@/components/ui/slug-field'
import { useAutoSlug } from '@/hooks/use-auto-slug'
import { slugify } from '@/lib/slug'

export interface SlugFieldWithAutoSlugProps {
  /**
   * Source text to derive the slug from (e.g., title, name).
   * The slug auto-generates from this text until manually edited.
   */
  sourceText: string

  /**
   * Optional initial slug (e.g., loading from edit mode).
   * Overrides the auto-generated slug on first render.
   */
  initialSlug?: string

  /**
   * Called whenever the slug value changes — both from auto-generation
   * and manual edits. Useful for syncing slug to parent state.
   */
  onChange?: (value: string) => void

  /** Prefix for preview URL (default: 'blog') */
  previewPrefix?: string

  /** Optional error message */
  error?: string

  /** Site base URL for full preview (optional) */
  siteUrl?: string

  /** Show the label "Slug" (default: true) */
  showLabel?: boolean

  /** Additional class names */
  className?: string

  /** Disable editing */
  disabled?: boolean
}

/**
 * SlugFieldWithAutoSlug — SlugField with integrated auto-slug generation.
 *
 * Wraps `useAutoSlug` + `SlugField` into a single component.
 * Automatically generates the slug from `sourceText` and stops
 * auto-syncing when the user manually edits the slug.
 *
 * One-prop usage:
 * ```tsx
 * <SlugFieldWithAutoSlug sourceText={title} />
 * ```
 *
 * With slug sync to parent:
 * ```tsx
 * <SlugFieldWithAutoSlug sourceText={title} onChange={(slug) => setSlugInParent(slug)} />
 * ```
 *
 * Edit mode with initial slug:
 * ```tsx
 * <SlugFieldWithAutoSlug sourceText={title} initialSlug={post.slug} />
 * ```
 *
 * All SlugField features (reset, copy, preview, error state) work automatically.
 */
export default function SlugFieldWithAutoSlug({
  sourceText,
  initialSlug,
  onChange,
  previewPrefix = 'blog',
  error,
  siteUrl,
  showLabel = true,
  className,
  disabled,
}: SlugFieldWithAutoSlugProps) {
  const { slug, isManuallyEdited, setSlug, reset } = useAutoSlug(sourceText, initialSlug)

  const handleChange = (value: string) => {
    setSlug(value)
    onChange?.(value)
  }

  const handleReset = () => {
    const regenerated = slugify(sourceText)
    reset()
    onChange?.(regenerated)
  }

  return (
    <SlugField
      value={slug}
      onChange={handleChange}
      sourceText={sourceText}
      isManuallyEdited={isManuallyEdited}
      onReset={handleReset}
      previewPrefix={previewPrefix}
      error={error}
      siteUrl={siteUrl}
      showLabel={showLabel}
      className={className}
      disabled={disabled}
    />
  )
}
