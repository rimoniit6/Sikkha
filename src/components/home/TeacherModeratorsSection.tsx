'use client'

import { Avatar,AvatarFallback,AvatarImage } from '@/components/ui/avatar'
import { Card,CardContent } from '@/components/ui/card'
import { useSiteConfig,useTeacherModerators } from '@/hooks/use-metadata'
import { GraduationCap } from 'lucide-react'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.slice(0, 2)
}

export default function TeacherModeratorsSection() {
  const { teachers, loading } = useTeacherModerators()
  const { config } = useSiteConfig()

  if (!loading && teachers.length === 0) return null

  return (
    <section className="py-14 sm:py-16 bg-gradient-to-b from-transparent via-emerald-50/30 to-transparent dark:via-emerald-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {config?.homepageTeachersTitle || 'আমাদের শিক্ষক ও মডারেটর'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            {config?.homepageTeachersSubtitle || 'যারা আছেন আপনার পাশে'}
          </p>
        </div>

        {loading ? (
          /* Mobile: horizontal scroll, Desktop: grid */
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-6 scrollbar-thin">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="snap-center shrink-0 w-[260px] sm:w-auto rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Mobile: horizontal scroll cards, Desktop: grid */
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-6 scrollbar-thin">
            {teachers.map((teacher, idx) => (
              <div
                key={teacher.id}
                className="snap-center shrink-0 w-[260px] sm:w-auto animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-card hover:-translate-y-1 rounded-xl sm:rounded-2xl h-full">
                  <div className="h-1.5 sm:h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    {/* Horizontal layout: Avatar | Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 scale-125 group-hover:scale-150 transition-transform duration-500" />
                        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-emerald-200 dark:ring-emerald-800 group-hover:ring-emerald-400 transition-all relative">
                          <AvatarImage src={teacher.image || undefined} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm sm:text-base font-bold">
                            {getInitials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                          {teacher.name}
                        </h3>
                        <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {teacher.title}
                        </p>
                        {teacher.institution && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground/70 flex items-center gap-1 mt-1">
                            <GraduationCap className="w-3 h-3 shrink-0" />
                            <span className="truncate">{teacher.institution}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
