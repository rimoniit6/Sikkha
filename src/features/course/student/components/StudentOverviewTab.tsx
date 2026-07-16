'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Target, ListChecks, Users } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'

interface Props {
  course: {
    description: string | null
    features: string | null; requirements: string | null
    targetStudents: string | null; hasCertificate: boolean
    teacherName: string | null; language: string | null
  }
}

export default function StudentOverviewTab({ course }: Props) {
  const safeFeatures = useMemo(() => sanitizeHtml(course.features || ''), [course.features])
  const safeRequirements = useMemo(() => sanitizeHtml(course.requirements || ''), [course.requirements])
  const safeTargetStudents = useMemo(() => sanitizeHtml(course.targetStudents || ''), [course.targetStudents])
  return (
    <div className="space-y-6">
      {course.description && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />কোর্স সম্পর্কে</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{course.description}</p></CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {course.features && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ListChecks className="h-4 w-4" />কোর্স ফিচার</CardTitle></CardHeader>
            <CardContent><div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: safeFeatures }} /></CardContent>
          </Card>
        )}

        {course.requirements && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Target className="h-4 w-4" />প্রয়োজনীয়তা</CardTitle></CardHeader>
            <CardContent><div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: safeRequirements }} /></CardContent>
          </Card>
        )}
      </div>

      {course.targetStudents && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />উদ্দেশ্য ছাত্র-ছাত্রী</CardTitle></CardHeader>
          <CardContent><div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: safeTargetStudents }} /></CardContent>
        </Card>
      )}

    </div>
  )
}
