'use client'

/**
 * ImageLightbox — Full-screen image overlay for blog and content images.
 *
 * Features:
 * - Fixed overlay with dark semi-transparent backdrop
 * - Image displayed at max viewport size (respects aspect ratio)
 * - Alt text and caption displayed below the image
 * - Close button (top-right X) + Escape key + click-outside-to-close
 * - Fade-in CSS animation
 * - Prevents body scroll when open
 * - Touch/mobile friendly
 */

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LightboxImage {
  src: string
  alt?: string
  title?: string | null
}

interface ImageLightboxProps {
  image: LightboxImage
  onClose: () => void
}

export default function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [handleEscape])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 size-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        aria-label="বন্ধ করুন"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Image container */}
      <div
        className={cn(
          'relative max-w-[90vw] max-h-[85vh] animate-scale-in',
        )}
      >
        <div className="relative flex items-center justify-center">
          <Image
            src={image.src}
            alt={image.alt || ''}
            width={1200}
            height={800}
            className="max-w-full max-h-[75vh] w-auto h-auto rounded-lg object-contain shadow-2xl"
            style={{ width: 'auto', height: 'auto' }}
            unoptimized
            priority
          />
        </div>

        {/* Caption / Alt text */}
        {(image.title || image.alt) && (
          <div className="mt-3 text-center">
            {image.title && (
              <p className="text-sm text-white/90 font-medium">{image.title}</p>
            )}
            {image.alt && !image.title && (
              <p className="text-sm text-white/70">{image.alt}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
