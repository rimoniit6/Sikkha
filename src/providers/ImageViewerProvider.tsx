'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import ImageLightbox from '@/components/ui/image-lightbox'
import type { LightboxImage } from '@/components/ui/image-lightbox'

// ─── Context ─────────────────────────────────────────────────────────────────

interface ImageViewerContextValue {
  /** Open the global image viewer with one or more images */
  openViewer: (images: LightboxImage[], initialIndex?: number) => void
  /** Close the viewer */
  closeViewer: () => void
}

const ImageViewerContext = createContext<ImageViewerContextValue | null>(null)

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useImageViewer(): ImageViewerContextValue | null {
  return useContext(ImageViewerContext)
}

// ─── Provider ────────────────────────────────────────────────────────────────

export default function ImageViewerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<LightboxImage[]>([])
  const [initialIndex, setInitialIndex] = useState(0)

  const openViewer = useCallback(
    (newImages: LightboxImage[], index = 0) => {
      setImages(newImages)
      setInitialIndex(index)
      setOpen(true)
    },
    [],
  )

  const closeViewer = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({ openViewer, closeViewer }),
    [openViewer, closeViewer],
  )

  return (
    <ImageViewerContext.Provider value={value}>
      {children}
      <ImageLightbox
        images={images}
        initialIndex={initialIndex}
        open={open}
        onOpenChange={setOpen}
      />
    </ImageViewerContext.Provider>
  )
}
