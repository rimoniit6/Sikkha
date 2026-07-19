# Sprint 6 — Analytics — Implementation Documentation

## Overview

Workflow analytics dashboard with KPI cards, charts, and metrics. Follows existing RevenueDashboard patterns using Recharts, KpiCard, and ChartCard components.

## Architecture

```
GET /api/admin/workflow/analytics?days=30
        │
        ▼
Promise.all([
  groupBy(status),           // Status distribution
  count(),                   // Total workflows
  groupBy(action),           // Recent transitions
  aggregate(publishAttempts), // Publish metrics
  aggregate(version),        // Version stats
  groupBy(entityType),       // Content type breakdown
])
        │
        ▼
WorkflowAnalytics component (Recharts + KpiCard)
```

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/admin/workflow/analytics/route.ts` | CREATED | Analytics endpoint |
| `src/components/admin/WorkflowAnalytics.tsx` | CREATED | Dashboard component |
| `src/hooks/admin/use-workflow-analytics.ts` | CREATED | React Query hook |
| `src/app/api/admin/workflow/analytics/__tests__/route.test.ts` | CREATED | Unit tests |
| `src/lib/query-keys.ts` | MODIFIED | Added workflowAnalytics key |

## Metrics

### KPI Cards
- Total workflows
- Average version number
- Publish success rate (%)
- Pending scheduled count

### Charts
- **Status Distribution** — DonutChart showing current workflow states
- **Content Type Breakdown** — DonutChart by entityType
- **Recent Transitions** — BarChart of transition actions (last N days)
- **Publish Metrics** — Progress bar + stats (success rate, retries, pending)

### Status Summary
Grid showing count per status with color indicators.

## API Response

```json
{
  "totalWorkflows": 150,
  "averageVersion": 2.3,
  "statusDistribution": {
    "draft": 20,
    "inReview": 15,
    "approved": 10,
    "rejected": 5,
    "scheduled": 8,
    "published": 90,
    "archived": 2
  },
  "recentTransitions": {
    "period": "30 days",
    "total": 45,
    "byAction": { "submit": 15, "approve": 10, "publish": 8 }
  },
  "publish": {
    "successRate": 92,
    "pendingScheduled": 8,
    "totalPublished": 90,
    "averageRetries": 0.3,
    "totalRetries": 27,
    "workflowsWithRetries": 12
  },
  "contentTypes": { "lecture": 80, "mcq": 50, "cq": 20 }
}
```

## Key Design Decisions

1. **Follows existing patterns** — Uses KpiCard, ChartCard, DonutChart, BarChart
2. **Bengali labels** — All UI text in Bengali
3. **Period selector** — 7/30/90 day options
4. **No new dependencies** — Uses existing Recharts setup
5. **Parallel queries** — All 7 queries run in parallel via Promise.all

## Test Results

- New tests: 6/6 passing
- Full suite: 403/409 passing (6 pre-existing failures)
