'use client'

import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
          </div>
        </div>
      }>
        {children}
      </Suspense>
    </AppShell>
  )
}
