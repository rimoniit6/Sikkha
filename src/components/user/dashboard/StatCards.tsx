import React, { memo } from 'react'
import { BookOpen, BarChart3, Bookmark, ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useCountUp } from '@/hooks/use-count-up'
import { Reveal } from '@/components/shared/Reveal'

interface StatCardsProps {
  stats: {
    completedLectures: number
    totalLectures: number
    avgMcqScore: number
    savedQuestions: number
  }
  approvedPaymentsCount: number
  onPurchasedClick: () => void
}

function AnimatedStatCard({ icon: Icon, value, label, gradient, bgGradient, iconColor, progressValue, onClick }: {
  icon: React.ElementType
  value: number
  label: string
  gradient: string
  bgGradient: string
  iconColor: string
  progressValue: number
  onClick?: () => void
}) {
  const { ref, value: animatedValue } = useCountUp(value, 1500)
  return (
    <Reveal delay={100}>
      <Card className="border-0 shadow-lg shadow-emerald-500/5 overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 card-lift cursor-pointer" onClick={onClick}>
        <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center h-[9rem] relative">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-60`} />
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${bgGradient} mb-2.5 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`size-5 ${iconColor}`} />
          </div>
          <p ref={ref as React.Ref<HTMLParagraphElement>} className="text-2xl sm:text-3xl font-bold tabular-nums">
            {label.includes('স্কোর') ? `${animatedValue}%` : animatedValue}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          <div className="mt-auto w-full">
            <Progress value={progressValue} className={`h-1.5 [&>div]:bg-gradient-to-r ${gradient}`} />
          </div>
        </CardContent>
      </Card>
    </Reveal>
  )
}

function StatCardsComponent({ stats, approvedPaymentsCount, onPurchasedClick }: StatCardsProps) {
  const lecturesProgress = stats.totalLectures > 0 ? (stats.completedLectures / stats.totalLectures) * 100 : 0
  const savedProgress = Math.min(stats.savedQuestions * 10, 100)
  const purchasedProgress = Math.min(approvedPaymentsCount * 20, 100)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
      <AnimatedStatCard
        icon={BookOpen}
        value={stats.completedLectures}
        label="সম্পন্ন লেকচার"
        gradient="from-emerald-400 to-teal-500"
        bgGradient="from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40"
        iconColor="text-emerald-600 dark:text-emerald-400"
        progressValue={lecturesProgress}
      />
      <AnimatedStatCard
        icon={BarChart3}
        value={stats.avgMcqScore}
        label="MCQ স্কোর"
        gradient="from-teal-400 to-cyan-500"
        bgGradient="from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40"
        iconColor="text-teal-600 dark:text-teal-400"
        progressValue={stats.avgMcqScore}
      />
      <AnimatedStatCard
        icon={Bookmark}
        value={stats.savedQuestions}
        label="সেভ করা প্রশ্ন"
        gradient="from-amber-400 to-orange-500"
        bgGradient="from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40"
        iconColor="text-amber-600 dark:text-amber-400"
        progressValue={savedProgress}
      />
      <AnimatedStatCard
        icon={ShoppingBag}
        value={approvedPaymentsCount}
        label="মোট ক্রয়"
        gradient="from-purple-400 via-violet-400 to-teal-400"
        bgGradient="from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40"
        iconColor="text-purple-600 dark:text-purple-400"
        progressValue={purchasedProgress}
        onClick={onPurchasedClick}
      />
    </div>
  )
}

export const StatCards = memo(StatCardsComponent)
