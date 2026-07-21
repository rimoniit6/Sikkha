'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BlogCategoryRecord } from '@/features/blog/types/blog'

interface Props {
  categories: BlogCategoryRecord[]
}

export default function BlogSidebar({ categories }: Props) {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="font-semibold mb-4">ক্যাটাগরি</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog/category/${cat.slug}`}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted transition-colors text-sm"
            >
              <span>{cat.name}</span>
              <Badge variant="secondary" className="text-xs">
                {(cat as any)._count?.posts || 0}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
