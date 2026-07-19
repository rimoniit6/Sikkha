import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/workflow/analytics
 *
 * Returns workflow analytics for the admin dashboard.
 * Metrics: status distribution, transitions, publish rate, retry stats.
 */
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      statusDistribution,
      totalWorkflows,
      recentTransitions,
      publishStats,
      retryStats,
      averageVersion,
      contentTypeBreakdown,
    ] = await Promise.all([
      // 1. Status distribution (current state of all workflows)
      db.contentWorkflow.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // 2. Total workflows
      db.contentWorkflow.count(),

      // 3. Recent transitions (workflow history in last N days)
      db.workflowHistory.groupBy({
        by: ['action'],
        where: { createdAt: { gte: fromDate } },
        _count: { id: true },
      }),

      // 4. Publish stats (SCHEDULED workflows with retry info)
      db.contentWorkflow.aggregate({
        where: { status: 'SCHEDULED' },
        _count: { id: true },
        _avg: { publishAttempts: true },
        _sum: { publishAttempts: true },
      }),

      // 5. Retry stats (workflows that had retries)
      db.contentWorkflow.aggregate({
        where: { publishAttempts: { gt: 0 } },
        _count: { id: true },
      }),

      // 6. Average version number
      db.contentWorkflow.aggregate({
        _avg: { version: true },
      }),

      // 7. Content type breakdown
      db.contentWorkflow.groupBy({
        by: ['entityType'],
        _count: { id: true },
      }),
    ])

    // Build response
    const statusMap: Record<string, number> = {}
    for (const item of statusDistribution) {
      statusMap[item.status] = item._count.id
    }

    const transitionMap: Record<string, number> = {}
    for (const item of recentTransitions) {
      transitionMap[item.action] = item._count.id
    }

    const contentTypeMap: Record<string, number> = {}
    for (const item of contentTypeBreakdown) {
      contentTypeMap[item.entityType] = item._count.id
    }

    // Calculate publish success rate
    const scheduledCount = statusMap['SCHEDULED'] || 0
    const publishedCount = statusMap['PUBLISHED'] || 0
    const totalAttempted = scheduledCount + publishedCount
    const publishSuccessRate = totalAttempted > 0
      ? Math.round((publishedCount / totalAttempted) * 100)
      : 0

    const analytics = {
      // Overview
      totalWorkflows,
      averageVersion: Number(averageVersion._avg.version?.toFixed(1)) || 0,

      // Status distribution
      statusDistribution: {
        draft: statusMap['DRAFT'] || 0,
        inReview: statusMap['IN_REVIEW'] || 0,
        approved: statusMap['APPROVED'] || 0,
        rejected: statusMap['REJECTED'] || 0,
        scheduled: scheduledCount,
        published: publishedCount,
        archived: statusMap['ARCHIVED'] || 0,
      },

      // Recent transitions (last N days)
      recentTransitions: {
        period: `${days} days`,
        total: Object.values(transitionMap).reduce((a, b) => a + b, 0),
        byAction: transitionMap,
      },

      // Publish metrics
      publish: {
        successRate: publishSuccessRate,
        pendingScheduled: scheduledCount,
        totalPublished: publishedCount,
        averageRetries: Number(publishStats._avg.publishAttempts?.toFixed(2)) || 0,
        totalRetries: publishStats._sum.publishAttempts || 0,
        workflowsWithRetries: retryStats._count.id,
      },

      // Content type breakdown
      contentTypes: contentTypeMap,
    }

    return apiResponse(analytics)
  } catch (error) {
    return handleApiError(error, 'Admin Workflow Analytics')
  }
}
