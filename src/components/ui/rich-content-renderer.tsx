'use client'

/**
 * RichContentRenderer — SINGLE entry point for all formatted content.
 *
 * KaTeX renders LaTeX ($...$ / $$...$$). MathJax renders any <math> tags
 * that survived MathML→LaTeX conversion (fallback).
 *
 * No overlap: KaTeX handles LaTeX, MathJax handles <math>. Two engines,
 * two content types — zero double-rendering.
 *
 * Anti-flash: Content with MathML waits for MathJax typeset before becoming
 * visible, preventing raw unstyled MathML flash.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react'
import { processContent } from '@/lib/mathml-service'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import 'katex/dist/katex.min.css'

/**
 * Transforms <img title="..."> into <figure><img><figcaption>...</figcaption></figure>
 * to render image captions as visible text below the image.
 */
function processImageCaptions(htmlStr: string): string {
  if (!htmlStr) return htmlStr
  return htmlStr.replace(
    /<img\s+[^>]*?title="([^"]*)"[^>]*?>/gi,
    (match, caption) => {
      if (!caption.trim()) return match
      return `<figure class="image-figure relative mx-auto my-3 leading-none">${match}<figcaption class="image-caption block text-center text-xs text-muted-foreground/80 mt-1.5 px-2">${caption}</figcaption></figure>`
    },
  )
}

interface RichContentRendererProps {
  content: string
  className?: string
  inline?: boolean
  as?: 'div' | 'span' | 'p'
  maxLength?: number
}

export default function RichContentRenderer({
  content,
  className,
  inline = false,
  as: WrapperProp,
  maxLength,
}: RichContentRendererProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [mathReady, setMathReady] = useState(true)

  const { html, hasSurvivingMathML } = useMemo(() => {
    const raw = processContent(content)
    return {
      html: processImageCaptions(raw.html),
      hasSurvivingMathML: raw.hasSurvivingMathML,
    }
  }, [content])

  const needsMathJax = html && hasSurvivingMathML

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!needsMathJax) return

    const el = wrapperRef.current
    if (!el) return

    const tryTypeset = (retries: number) => {
      const mj = (window as unknown as { MathJax?: { typesetPromise: (els: HTMLElement[]) => Promise<void> } }).MathJax
      if (mj?.typesetPromise) {
        mj.typesetPromise([el]).then(() => setMathReady(true)).catch(() => setMathReady(true))
      } else if (retries > 0) {
        timerRef.current = setTimeout(() => tryTypeset(retries - 1), 300)
      } else {
        setMathReady(true)
      }
    }
    tryTypeset(5)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [needsMathJax])

  const showMathLoader = needsMathJax && !mathReady

  if (!content) return null

  const Wrapper = WrapperProp || (inline ? 'span' : 'div')

  const trimmed = maxLength && html.length > maxLength
    ? html.slice(0, maxLength) + '...'
    : html

  return (
    <Wrapper
      ref={wrapperRef as never}
      className={cn(
        'transition-opacity duration-300',
        showMathLoader && 'opacity-0',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(trimmed) }}
    />
  )
}
