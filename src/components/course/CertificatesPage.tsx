'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Loader2, ArrowLeft, Download, BookOpen } from 'lucide-react'
import Thumbnail from '@/components/ui/thumbnail'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouterStore } from '@/store/router'
import { courseService } from '@/services/api/course.service'

interface CertItem {
  id: string
  serial: string
  issuedAt: string
  course: { id: string; title: string; slug: string; thumbnail: string | null }
}

export default function CertificatesPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const [certs, setCerts] = useState<CertItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCerts()
  }, [])

  async function fetchCerts() {
    setLoading(true)
    try {
      const res = await courseService.certificates()
      setCerts(res.certificates || [])
    } catch {
      setCerts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">আমার সার্টিফিকেট</h1>
            <p className="text-sm text-muted-foreground">সফলভাবে সম্পন্ন করা কোর্সের সনদ</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Award className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">কোনো সার্টিফিকেট নেই</h3>
            <p className="mt-1 text-sm text-muted-foreground">কোর্স সম্পন্ন করে সার্টিফিকেট অর্জন করুন</p>
            <Button className="mt-4" onClick={() => navigate('course-list')}>কোর্স দেখুন</Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {certs.map((cert) => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden border-2 border-amber-200">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {cert.course.thumbnail && (
                        <Thumbnail src={cert.course.thumbnail} alt={cert.course.title} width={112} height={80} className="rounded-lg shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-amber-600" />
                          <h3 className="font-semibold line-clamp-2">{cert.course.title}</h3>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          ইস্যু: {new Date(cert.issuedAt).toLocaleDateString('bn-BD')}
                        </p>
                        <p className="text-xs text-muted-foreground">সিরিয়াল: {cert.serial}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border-t bg-amber-50/50 px-4 py-2 dark:bg-amber-950/20">
                      <a
                        href={`/api/courses/certificate?download=1&courseId=${cert.course.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                      >
                        <Download className="h-3.5 w-3.5" />ডাউনলোড
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => navigate('course-detail', { courseSlug: cert.course.slug })}>
                        <BookOpen className="mr-1 h-3.5 w-3.5" />কোর্স
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
