'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { getFileUrl, getImagePlaceholder } from '@/lib/file-url'
import { cn } from '@/lib/utils'
import { useImageViewer } from '@/providers/ImageViewerProvider'

interface SafeImageProps {
  src: string | null | undefined
  alt: string
  fallback?: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  loading?: 'lazy' | 'eager'
  sizes?: string
  /** object-fit: 'cover' (default) or 'contain' */
  objectFit?: 'cover' | 'contain'
  style?: React.CSSProperties
  onClick?: React.MouseEventHandler<HTMLDivElement | HTMLImageElement>
  /** When true, clicking the image opens the global image viewer. Default: true */
  clickable?: boolean
}

export default function SafeImage({
  src,
  alt,
  fallback,
  className,
  width,
  height,
  priority,
  loading,
  sizes,
  objectFit,
  style,
  onClick,
  clickable = true,
}: SafeImageProps) {
  const [error, setError] = useState(false)
  const resolvedSrc = src ? getFileUrl(src) : ''
  const imgSrc = !resolvedSrc
    ? (fallback || getImagePlaceholder())
    : error
      ? (fallback || getImagePlaceholder())
      : resolvedSrc

  const viewer = useImageViewer()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => {
      onClick?.(e)

      if (clickable && resolvedSrc && !error && viewer) {
        viewer.openViewer([{ src: resolvedSrc, alt }], 0)
      }
    },
    [onClick, clickable, resolvedSrc, error, viewer, alt],
  )

  const hasExplicitDimensions = width !== undefined || height !== undefined

  if (hasExplicitDimensions) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        className={cn(
          clickable && resolvedSrc && !error ? 'cursor-pointer' : '',
          objectFit === 'contain' ? 'object-contain' : 'object-cover',
          className,
        )}
        width={width || 400}
        height={height || 300}
        priority={priority}
        loading={loading}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        style={style}
        onClick={handleClick}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        clickable && resolvedSrc && !error ? 'cursor-pointer' : '',
        className,
      )}
      style={style}
      onClick={handleClick}
    >
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={objectFit === 'contain' ? 'object-contain' : 'object-cover'}
        priority={priority}
        loading={loading}
        sizes={sizes || "(max-width: 768px) 100vw, 33vw"}
        onError={() => setError(true)}
      />
    </div>
  )
}
