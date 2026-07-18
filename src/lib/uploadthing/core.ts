import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { verifyAuth } from '@/lib/auth'

const f = createUploadthing()

function withErrorLog<Args extends unknown[], Result>(name: string, fn: (...args: Args) => Result): (...args: Args) => Result | Promise<Awaited<Result>> {
  return ((...args: Args) => {
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        return result.catch((err) => {
          console.error(`[UploadThing] ${name} error:`, err)
          throw err
        })
      }
      return result
    } catch (err) {
      console.error(`[UploadThing] ${name} error:`, err)
      throw err
    }
  })
}

// Branding/assets and content uploads are restricted to admins and super-admins.
async function requireAdminMiddleware(req: Request) {
  const auth = await verifyAuth(req)
  if (!auth?.user) throw new Error('Unauthorized')
  if (!auth.isAdmin) throw new Error('Forbidden: admin role required')
  return { userId: auth.user.id }
}

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(
      withErrorLog('imageUploader.middleware', async ({ req }) => {
        return requireAdminMiddleware(req)
      })
    )
    .onUploadComplete(
      withErrorLog('imageUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),

  pdfUploader: f({ pdf: { maxFileSize: '16MB', maxFileCount: 5 } })
    .middleware(
      withErrorLog('pdfUploader.middleware', async ({ req }) => {
        return requireAdminMiddleware(req)
      })
    )
    .onUploadComplete(
      withErrorLog('pdfUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),

  mediaUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    video: { maxFileSize: '256MB', maxFileCount: 1 },
    audio: { maxFileSize: '64MB', maxFileCount: 1 },
  })
    .middleware(
      withErrorLog('mediaUploader.middleware', async ({ req }) => {
        return requireAdminMiddleware(req)
      })
    )
    .onUploadComplete(
      withErrorLog('mediaUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),

  screenshotUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(
      withErrorLog('screenshotUploader.middleware', async ({ req }) => {
        return requireAdminMiddleware(req)
      })
    )
    .onUploadComplete(
      withErrorLog('screenshotUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url }
      })
    ),

  assignmentUploader: f({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
  })
    .middleware(
      withErrorLog('assignmentUploader.middleware', async ({ req }) => {
        return requireAdminMiddleware(req)
      })
    )
    .onUploadComplete(
      withErrorLog('assignmentUploader.onUploadComplete', async ({ file }) => {
        return { url: file.url, name: file.name, type: file.type }
      })
    ),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
