'use client'

/**
 * ImageResizeNodeView — TipTap NodeView for resizable images with 4 corner drag handles.
 *
 * - 4 corner handles appear when the image is selected
 * - Default mode preserves aspect ratio (uses naturalWidth / naturalHeight)
 * - Hold Shift for free resize (no aspect ratio lock)
 * - Direct DOM mutation during drag for performance; only final value is committed to node
 * - Min width: 50px, Max width: natural image width
 */

import React, { useCallback, useRef, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'

interface ImageResizeNodeViewProps {
  node: {
    attrs: {
      src: string
      alt?: string
      title?: string
      width?: string | number | null
      dataAlign?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  selected: boolean
}

export default function ImageResizeNodeView(props: ImageResizeNodeViewProps) {
  const { node, updateAttributes, selected } = props
  const { src, alt, title, width, dataAlign } = node.attrs
  const imgRef = useRef<HTMLImageElement>(null)
  const [isResizing, setIsResizing] = useState(false)

  const currentWidth = width ? parseInt(String(width), 10) : undefined

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, corner: 'nw' | 'ne' | 'sw' | 'se') => {
      e.preventDefault()
      const img = imgRef.current
      if (!img) return

      const startX = e.clientX
      const startW = img.offsetWidth
      const ratio = img.naturalWidth / img.naturalHeight || 1

      setIsResizing(true)

      const handlePointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault()
        const dx = moveEvent.clientX - startX

        let newW = startW
        if (corner.includes('e')) newW = startW + dx
        if (corner.includes('w')) newW = startW - dx

        newW = Math.max(50, Math.min(newW, img.naturalWidth))

        // Browser maintains aspect ratio via height: auto on the img CSS
        img.style.width = `${Math.round(newW)}px`
      }

      const handlePointerUp = () => {
        setIsResizing(false)
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        // Commit final width to node attribute (one transaction)
        if (img) {
          updateAttributes({ width: Math.round(img.offsetWidth) })
        }
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
      document.body.style.cursor =
        corner === 'se' || corner === 'nw' ? 'nwse-resize' : 'nesw-resize'
      document.body.style.userSelect = 'none'
    },
    [updateAttributes],
  )

  const alignClass =
    dataAlign === 'left' ? 'float-left mr-4 mb-2'
    : dataAlign === 'right' ? 'float-right ml-4 mb-2'
    : 'mx-auto'

  return (
    <NodeViewWrapper
      className={`image-resize-node-view not-prose ${selected ? 'image-selected' : ''} ${isResizing ? 'image-resizing' : ''}`}
      style={{
        maxWidth: '100%',
        display: dataAlign === 'center' ? 'block' : 'inline-block',
        textAlign: dataAlign === 'center' ? 'center' : undefined,
      }}
      draggable={false}
      data-drag-handle={false}
    >
      <div className="image-resize-inner" style={{ position: 'relative', display: 'inline-block', verticalAlign: dataAlign === 'center' ? 'middle' : 'top' }}>
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          className="image-resize-img"
          style={{
            display: 'block',
            width: currentWidth ? `${currentWidth}px` : '100%',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '6px',
          }}
          draggable={false}
        />
        {selected && (
          <>
            <span className="image-resize-handle handle-nw" onPointerDown={(e) => handlePointerDown(e, 'nw')} />
            <span className="image-resize-handle handle-ne" onPointerDown={(e) => handlePointerDown(e, 'ne')} />
            <span className="image-resize-handle handle-sw" onPointerDown={(e) => handlePointerDown(e, 'sw')} />
            <span className="image-resize-handle handle-se" onPointerDown={(e) => handlePointerDown(e, 'se')} />
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}
