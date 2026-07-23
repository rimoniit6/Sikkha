'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LightboxImage {
  /** URL for the image to display */
  src: string
  /** Alt text for the image */
  alt?: string
}

interface ImageLightboxProps {
  /** Array of images to display (pass a single-element array for a single image) */
  images: LightboxImage[]
  /** Index of the initially-visible image */
  initialIndex?: number
  /** Whether the lightbox is open */
  open: boolean
  /** Called when the lightbox should close */
  onOpenChange: (open: boolean) => void
}

// ─── Zoom Levels ─────────────────────────────────────────────────────────────

const ZOOM_STEPS = [1, 1.5, 2, 3, 4]
const DEFAULT_ZOOM_INDEX = 0

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [isZoomed, setIsZoomed] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // Reset state when images change or dialog opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
      setZoomIndex(DEFAULT_ZOOM_INDEX)
      setIsZoomed(false)
    }
  }, [open, initialIndex])

  const current = images[currentIndex]
  const hasMultiple = images.length > 1
  const canGoPrev = hasMultiple && currentIndex > 0
  const canGoNext = hasMultiple && currentIndex < images.length - 1

  // ─── Navigation ──────────────────────────────────────────────────────────

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
    setZoomIndex(DEFAULT_ZOOM_INDEX)
    setIsZoomed(false)
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(images.length - 1, i + 1))
    setZoomIndex(DEFAULT_ZOOM_INDEX)
    setIsZoomed(false)
  }, [images.length])

  // ─── Zoom ────────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))
    setIsZoomed(true)
  }, [])

  const zoomOut = useCallback(() => {
    setZoomIndex((i) => {
      const next = Math.max(0, i - 1)
      if (next === 0) setIsZoomed(false)
      return next
    })
  }, [])

  const toggleZoom = useCallback(() => {
    if (isZoomed) {
      setZoomIndex(DEFAULT_ZOOM_INDEX)
      setIsZoomed(false)
    } else {
      setZoomIndex(2) // 2x on click-to-zoom
      setIsZoomed(true)
    }
  }, [isZoomed])

  // ─── Wheel zoom ──────────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.deltaY < 0) {
        zoomIn()
      } else {
        zoomOut()
      }
    },
    [zoomIn, zoomOut],
  )

  // ─── Keyboard navigation ────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, canGoPrev, canGoNext, goPrev, goNext])

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!current) return null

  const zoomFactor = ZOOM_STEPS[zoomIndex] ?? 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 gap-0 border-0 rounded-none bg-black/95 backdrop-blur-sm"
        showCloseButton={false}
        onPointerDownOutside={() => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        {/* Screen-reader title */}
        <DialogTitle className="sr-only">
          {current.alt || 'ছবি প্রিভিউ'} ({currentIndex + 1}/{images.length})
        </DialogTitle>

        {/* ─── Top bar ────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            {hasMultiple && (
              <span className="text-white/80 text-sm font-medium tabular-nums">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 size-8"
              onClick={zoomOut}
              disabled={zoomIndex === 0}
              title="জুম আউট"
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-white/60 text-xs tabular-nums w-8 text-center">
              {Math.round(zoomFactor * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 size-8"
              onClick={zoomIn}
              disabled={zoomIndex >= ZOOM_STEPS.length - 1}
              title="জুম ইন"
            >
              <ZoomIn className="size-4" />
            </Button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            {/* Close */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 size-8"
              onClick={() => onOpenChange(false)}
              title="বন্ধ করুন"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* ─── Image area ─────────────────────────────────────────── */}
        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden cursor-zoom-in group"
          onClick={toggleZoom}
          onWheel={handleWheel}
        >
          {/* Navigation arrows — visible on hover */}
          {canGoPrev && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 z-40 size-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              title="পূর্ববর্তী"
            >
              <ChevronLeft className="size-6" />
            </Button>
          )}
          {canGoNext && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 z-40 size-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              title="পরবর্তী"
            >
              <ChevronRight className="size-6" />
            </Button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={current.src}
            alt={current.alt || 'প্রিভিউ ছবি'}
            className={cn(
              'max-w-[95vw] max-h-[90vh] object-contain transition-transform duration-200 ease-out select-none',
              isZoomed && 'cursor-zoom-out',
            )}
            style={{
              transform: `scale(${zoomFactor})`,
            }}
            draggable={false}
          />
        </div>

        {/* ─── Bottom info bar ────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 z-50 flex items-center justify-center px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
          {current.alt && (
            <span className="text-white/60 text-xs truncate max-w-[80vw]">
              {current.alt}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
