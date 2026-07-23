'use client'

import SafeImage from '@/components/ui/safe-image'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type ThumbnailSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

export const THUMBNAIL_DIMENSIONS: Record<ThumbnailSize, { width: number; height: number; class: string }> = {
  xs: { width: 64, height: 64, class: 'size-16' },
  sm: { width: 80, height: 80, class: 'size-20' },
  md: { width: 160, height: 90, class: 'w-40 h-[90px]' },
  lg: { width: 320, height: 180, class: 'w-80 h-[180px]' },
  xl: { width: 400, height: 225, class: 'w-full max-w-[400px] h-[225px]' },
  full: { width: 800, height: 450, class: 'w-full aspect-video' },
}

interface ThumbnailProps {
  src: string | null | undefined
  alt: string
  size?: ThumbnailSize
  /** Custom width (overrides size preset) */
  width?: number
  /** Custom height (overrides size preset) */
  height?: number
  fallback?: string
  fallbackIcon?: ReactNode
  className?: string
  priority?: boolean
  /** Custom sizes attribute for next/image optimization */
  sizes?: string
  /** object-fit: 'cover' (default, crops to fill) or 'contain' (fits inside) */
  objectFit?: 'cover' | 'contain'
  /** When true, clicking opens the global image viewer. Default: true */
  clickable?: boolean
}

export default function Thumbnail({
  src,
  alt,
  size = 'md',
  width: customWidth,
  height: customHeight,
  fallback,
  fallbackIcon,
  className,
  priority,
  sizes,
  objectFit = 'cover',
  clickable = true,
}: ThumbnailProps) {
  const preset = THUMBNAIL_DIMENSIONS[size]
  const imgWidth = customWidth ?? preset.width
  const imgHeight = customHeight ?? preset.height
  const containerClass = customWidth || customHeight
    ? '' // custom dimensions — use SafeImage with explicit width/height
    : preset.class

  if (!src) {
    return (
      <div
        className={cn(
          containerClass || 'size-20',
          'rounded-lg bg-muted/30 flex items-center justify-center border border-border/50 shrink-0 overflow-hidden',
          className,
        )}
        style={customWidth || customHeight ? { width: customWidth, height: customHeight } : undefined}
      >
        {fallbackIcon || (
          <div className="text-muted-foreground/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-8"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>
    )
  }

  // Custom dimensions: use SafeImage with explicit width/height for zero CLS
  // Per-preset optimized sizes for next/image
  const presetSizes = sizes || (() => {
    switch (size) {
      case 'xs': return '64px'
      case 'sm': return '80px'
      case 'md': return '160px'
      case 'lg': return '320px'
      case 'xl': return '400px'
      default: return undefined
    }
  })()

  if (customWidth || customHeight) {
    return (
      <div
        className={cn('shrink-0 overflow-hidden rounded-lg', className)}
        style={{ width: customWidth, height: customHeight, maxWidth: '100%' }}
      >
        <SafeImage
          src={src}
          alt={alt}
          width={customWidth ?? imgWidth}
          height={customHeight ?? imgHeight}
          sizes={presetSizes}
          objectFit={objectFit}
          fallback={fallback}
          priority={priority}
          clickable={clickable}
        />
      </div>
    )
  }

  return (
    <div className={cn(containerClass, 'shrink-0 overflow-hidden rounded-lg', className)}>
      <SafeImage
        src={src}
        alt={alt}
        className="w-full h-full"
        sizes={presetSizes}
        objectFit={objectFit}
        fallback={fallback}
        priority={priority}
        clickable={clickable}
      />
    </div>
  )
}
