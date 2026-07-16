import { useState, useCallback } from 'react'
import { Loader2, Upload } from 'lucide-react'

interface UploadResult {
  ufsUrl: string
  url: string
  name: string
  size: number
  type: string
}

interface UseUploadThingOptions {
  onClientUploadComplete?: (res: UploadResult[]) => void
  onUploadError?: (error: Error) => void
}

export function useUploadThing(_endpoint: string, opts?: UseUploadThingOptions) {
  const [isUploading, setIsUploading] = useState(false)

  const startUpload = useCallback(async (files: File[]) => {
    setIsUploading(true)
    try {
      const results: UploadResult[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/local-upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(err.error || 'Upload failed')
        }
        const json = await res.json()
        results.push(...json.data)
      }
      opts?.onClientUploadComplete?.(results)
      return results
    } catch (error) {
      opts?.onUploadError?.(error as Error)
      return undefined
    } finally {
      setIsUploading(false)
    }
  }, [opts])

  return { startUpload, isUploading }
}

interface UploadDropzoneProps {
  endpoint?: string
  onClientUploadComplete?: (res: UploadResult[]) => void
  onUploadBegin?: () => void
  onUploadError?: (error: Error) => void
  appearance?: {
    container?: React.CSSProperties
    label?: React.CSSProperties
    allowedContent?: React.CSSProperties
    button?: React.CSSProperties
  }
  config?: Record<string, unknown>
}

export function UploadDropzone({
  onClientUploadComplete,
  onUploadBegin,
  onUploadError,
  appearance,
}: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    onUploadBegin?.()
    setUploading(true)
    try {
      const results: UploadResult[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/local-upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(err.error || 'Upload failed')
        }
        const json = await res.json()
        results.push(...json.data)
      }
      onClientUploadComplete?.(results)
    } catch (error) {
      onUploadError?.(error as Error)
    } finally {
      setUploading(false)
    }
  }, [onClientUploadComplete, onUploadBegin, onUploadError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    uploadFiles(Array.from(e.dataTransfer.files))
  }, [uploadFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) uploadFiles(Array.from(files))
    e.target.value = ''
  }, [uploadFiles])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('upload-dropzone-input')?.click()}
      style={{
        ...appearance?.container,
        opacity: uploading ? 0.6 : 1,
        pointerEvents: uploading ? 'none' : 'auto',
      }}
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
        dragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-border hover:border-emerald-400'
      }`}
    >
      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p style={appearance?.label} className="text-sm text-muted-foreground mt-2">আপলোড হচ্ছে...</p>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground/60" />
          <p style={appearance?.label} className="text-sm text-muted-foreground mt-2">
            ছবি আপলোড করতে ক্লিক করুন বা টেনে আনুন
          </p>
          <p style={appearance?.allowedContent} className="text-xs text-muted-foreground/60 mt-1">
            PNG, JPG, WebP or SVG - সর্বোচ্চ ৫MB
          </p>
        </>
      )}
      <input
        id="upload-dropzone-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

export default useUploadThing
