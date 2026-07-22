import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function BlogNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">পৃষ্ঠাটি খুঁজে পাওয়া যায়নি</h2>
        <p className="text-muted-foreground text-sm">
          আপনি যে ব্লগ পোস্ট বা পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই বা সরিয়ে ফেলা হয়েছে।
        </p>
        <div className="flex items-center gap-3">
          <Button variant="default" asChild>
            <Link href="/blog">ব্লগ হোমে ফিরুন</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">হোম পেজ</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
