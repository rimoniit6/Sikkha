'use client'

import { useMemo, useState } from 'react'
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react'
import { useWorkflowAnalytics } from '@/hooks/admin/use-workflow-analytics'
import { Card, CardContent } from '@/components/ui/card'
import KpiCard from '@/components/analytics/KpiCard'
import ChartCard from '@/components/analytics/ChartCard'
import BarChart from '@/components/analytics/charts/BarChart'
import DonutChart from '@/components/analytics/charts/DonutChart'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState'
import { AnalyticsPageSkeleton } from '@/components/analytics/AnalyticsSkeleton'

const STATUS_LABELS: Record<string, string> = {
  draft: 'খসড়া',
  inReview: 'পর্যালোচনায়',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
  scheduled: 'সময়নির্ধারিত',
  published: 'প্রকাশিত',
  archived: 'সংরক্ষিত',
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  inReview: '#3b82f6',
  approved: '#10b981',
  rejected: '#ef4444',
  scheduled: '#f59e0b',
  published: '#22c55e',
  archived: '#6b7280',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  lecture: 'লেকচার',
  mcq: 'এমসিকিউ',
  cq: 'সিকিউ',
  course: 'কোর্স',
  note: 'নোট',
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  lecture: '#3b82f6',
  mcq: '#8b5cf6',
  cq: '#ec4899',
  course: '#10b981',
  note: '#f59e0b',
}

export default function WorkflowAnalytics() {
  const { data, isLoading, isError, refetch } = useWorkflowAnalytics()
  const [period, setPeriod] = useState(30)

  const statusChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.statusDistribution)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        name: STATUS_LABELS[key] || key,
        value,
        color: STATUS_COLORS[key] || '#94a3b8',
      }))
  }, [data])

  const transitionChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.recentTransitions.byAction)
      .map(([key, value]) => ({
        action: key,
        count: value,
      }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  const contentTypeChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.contentTypes)
      .map(([key, value]) => ({
        name: CONTENT_TYPE_LABELS[key] || key,
        value,
        color: CONTENT_TYPE_COLORS[key] || '#94a3b8',
      }))
  }, [data])

  if (isLoading) return <AnalyticsPageSkeleton />
  if (isError) return <AnalyticsErrorState onRetry={() => refetch()} />
  if (!data) return <AnalyticsEmptyState />

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">সময়কাল:</span>
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setPeriod(days)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              period === days
                ? 'bg-edu-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {days} দিন
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="মোট ওয়ার্কফ্লো"
          value={data.totalWorkflows}
          icon={FileText}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <KpiCard
          title="গড় ভার্সন"
          value={data.averageVersion}
          icon={RefreshCw}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-50 dark:bg-purple-950/30"
        />
        <KpiCard
          title="প্রকাশের হার"
          value={`${data.publish.successRate}%`}
          icon={CheckCircle}
          color="text-green-600 dark:text-green-400"
          bg="bg-green-50 dark:bg-green-950/30"
        />
        <KpiCard
          title="আগামী প্রকাশ"
          value={data.publish.pendingScheduled}
          icon={Clock}
          color="text-yellow-600 dark:text-yellow-400"
          bg="bg-yellow-50 dark:bg-yellow-950/30"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <ChartCard title="স্ট্যাটাস বিতরণ" description="বর্তমান ওয়ার্কফ্লো স্ট্যাটাস">
          <DonutChart data={statusChartData} height={280} />
        </ChartCard>

        {/* Content Type Breakdown */}
        <ChartCard title="কন্টেন্ট টাইপ" description="এন্টিটি টাইপ অনুযায়ী বিতরণ">
          <DonutChart data={contentTypeChartData} height={280} />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transitions */}
        <ChartCard
          title="সাম্প্রতিক ট্রানজিশন"
          description={`গত ${period} দিনে`}
          action={
            <button
              onClick={() => refetch()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          }
        >
          <BarChart
            data={transitionChartData}
            xKey="action"
            series={[{ key: 'count', name: 'সংখ্যা', color: '#3b82f6' }]}
            height={280}
            formatY={(v) => v.toLocaleString('bn-BD')}
          />
        </ChartCard>

        {/* Publish Metrics */}
        <ChartCard title="প্রকাশ মেট্রিক্স" description="প্রকাশ প্রক্রিয়ার পরিসংখ্যান">
          <div className="space-y-4 p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">প্রকাশের হার</span>
              <span className="text-lg font-bold text-green-600">{data.publish.successRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${data.publish.successRate}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{data.publish.totalPublished}</p>
                <p className="text-xs text-muted-foreground">প্রকাশিত</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{data.publish.pendingScheduled}</p>
                <p className="text-xs text-muted-foreground">অপেক্ষমাণ</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">মোট রিট্রাই</span>
                <span className="font-medium">{data.publish.totalRetries}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">রিট্রাই সহ ওয়ার্কফ্লো</span>
                <span className="font-medium">{data.publish.workflowsWithRetries}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">গড় রিট্রাই</span>
                <span className="font-medium">{data.publish.averageRetries}</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Status Summary */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4">স্ট্যাটাস সারসংক্ষেপ</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {Object.entries(data.statusDistribution).map(([key, value]) => (
              <div key={key} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: STATUS_COLORS[key] }}
                />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{STATUS_LABELS[key]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <FileText className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">কোনো ওয়ার্কফ্লো ডেটা নেই</p>
      <p className="text-sm mt-1">কন্টেন্ট তৈরি করলে এখানে পরিসংখ্যান দেখা যাবে</p>
    </div>
  )
}
