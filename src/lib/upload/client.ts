/**
 * Re-export stub — the real uploadthing client lives at @/lib/uploadthing/client.
 * This module exists because several components import from @/lib/upload/client.
 * Uploads are disabled (FEATURE_UPLOAD=false), so we provide no-op stubs.
 */

// No-op stub for useUploadThing — returns a startUpload that immediately rejects
// since uploads are disabled in this environment
export function useUploadThing(_endpoint: string, _opts?: Record<string, unknown>) {
  return {
    startUpload: async () => {
      throw new Error('ফাইল আপলোড এখনো সক্রিয় নয়')
    },
    isUploading: false,
  }
}

// No-op UploadDropzone component
export function UploadDropzone(props: Record<string, unknown>) {
  return null
}

// Re-exports for convenience
export { useUploadThing as default } from './client'