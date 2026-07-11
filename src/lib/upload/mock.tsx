'use client'

import { useCallback, useRef, useState } from 'react'

interface UploadResult {
  url: string
  ufsUrl: string
  name: string
  size: number
  type: string
}

interface StartUploadOptions {
  onUploadProgress?: (progress: number) => void
  onClientUploadComplete?: (res: UploadResult[] | undefined) => void
  onUploadError?: (error: Error) => void
  onUploadBegin?: () => void
}

interface UseUploadThingReturn {
  startUpload: (files: File[], opts?: StartUploadOptions) => Promise<UploadResult[] | undefined>
  isUploading: boolean
  permittedFileInfo: null
}

function mockUpload(files: File[], opts?: StartUploadOptions): Promise<UploadResult[]> {
  return new Promise((resolve) => {
    const total = files.length
    let completed = 0
    opts?.onUploadBegin?.()
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const result: UploadResult = {
          url: dataUrl,
          ufsUrl: dataUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        }
        completed++
        opts?.onUploadProgress?.(Math.round((completed / total) * 100))
        if (completed === total) {
          const results = files.map((f, i) => ({
            url: i === completed - 1 ? dataUrl : URL.createObjectURL(f),
            ufsUrl: i === completed - 1 ? dataUrl : URL.createObjectURL(f),
            name: f.name,
            size: f.size,
            type: f.type,
          }))
          opts?.onClientUploadComplete?.(results)
          resolve(results)
        }
      }
      reader.readAsDataURL(file)
    }
  })
}

export function useUploadThing(
  _endpoint: string,
  opts?: StartUploadOptions,
): UseUploadThingReturn {
  const [isUploading, setIsUploading] = useState(false)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const startUpload = useCallback(
    async (files: File[]) => {
      setIsUploading(true)
      try {
        return await mockUpload(files, optsRef.current)
      } finally {
        setIsUploading(false)
      }
    },
    [],
  )

  return { startUpload, isUploading, permittedFileInfo: null }
}

interface UploadDropzoneProps {
  endpoint: string
  onUploadBegin?: () => void
  onClientUploadComplete?: (res: UploadResult[] | undefined) => void
  onUploadError?: (error: Error) => void
  appearance?: Record<string, React.CSSProperties>
  config?: Record<string, unknown>
}

export function UploadDropzone({
  onUploadBegin,
  onClientUploadComplete,
  onUploadError,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files?.length
    if (!files) return
    try {
      onUploadBegin?.()
      const results: UploadResult[] = Array.from(e.target.files).map((f) => ({
        url: URL.createObjectURL(f),
        ufsUrl: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        type: f.type,
      }))
      onClientUploadComplete?.(results)
    } catch (err) {
      onUploadError?.(err instanceof Error ? err : new Error('Upload failed'))
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      style={{
        borderRadius: '0.5rem',
        border: '2px dashed hsl(var(--border))',
        padding: '1.5rem',
        cursor: 'pointer',
        textAlign: 'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
        ছবি আপলোড করুন বা ক্লিক করুন
      </p>
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', marginTop: '0.25rem' }}>
        পর্যন্ত ৪MB
      </p>
    </div>
  )
}

export function UploadButton(_props: Record<string, unknown>) {
  return null
}

export function Uploader(_props: Record<string, unknown>) {
  return null
}
