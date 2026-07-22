'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
        <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">কিছু একটা সমস্যা হয়েছে</h2>
        <p className="text-muted-foreground text-sm">
          ব্লগ লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={reset} variant="default">
            আবার চেষ্টা করুন
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog">ব্লগ হোমে ফিরুন</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
