# Sprint 4 — Scheduled Publishing — Implementation Documentation

## Overview

Cron-driven scheduled publishing system. When content is scheduled with a `scheduledAt` date, a cron job running every minute picks it up and transitions it to PUBLISHED via the existing `transitionWorkflow()` engine.

## Architecture

```
Vercel Cron (*/1 * * *)
        │
        ▼
GET /api/admin/cron/publish-scheduled  (thin controller — auth only)
        │
        ▼
publishScheduledContent(db)            (business logic — retry, idempotency)
        │
        ▼
transitionWorkflow(db, { action: 'publish' })  (existing engine — NO changes)
```

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | MODIFIED | Added 4 retry fields to `ContentWorkflow` |
| `src/lib/scheduled-publish.ts` | CREATED | Core service: `publishScheduledContent()` + `resetFailedPublishes()` |
| `src/app/api/admin/cron/publish-scheduled/route.ts` | CREATED | Thin cron controller with dual auth |
| `vercel.json` | CREATED | Vercel cron schedule config |
| `src/lib/__tests__/scheduled-publish.test.ts` | CREATED | 16 unit tests |

## Schema Changes

Added 4 fields to `ContentWorkflow`:

```prisma
publishAttempts    Int       @default(0)
lastPublishAttempt DateTime?
publishFailedAt    DateTime?
publishError       String?
```

Migration: `npx prisma db push` (additive, no data loss).

## Service API

### `publishScheduledContent(db, options?)`

Finds all SCHEDULED workflows where `scheduledAt <= now`, `publishFailedAt IS NULL`, and `publishAttempts < 3`. Processes them sequentially.

**Options:**
- `dryRun?: boolean` — if true, returns eligible workflows without transitioning

**Returns:** `ScheduledPublishReport` with `total`, `published`, `failed`, `skipped`, `results[]`, `duration`

**Retry Logic:**
- Each failed attempt increments `publishAttempts`
- After 3 failures, sets `publishFailedAt` (permanent failure)
- On success, resets `publishAttempts` to 0

### `resetFailedPublishes(db, options?)`

Resets failed publish state for permanent failures. Returns count of reset records.

**Options:**
- `entityType?: string` — filter by entity type
- `entityId?: string` — filter by entity ID

## Auth

The cron endpoint supports two authentication methods:

1. **Vercel Cron:** `Authorization: Bearer <CRON_SECRET>`
2. **Admin manual trigger:** Session auth via `withAdmin()`

## Key Design Decisions

1. **Sequential processing** — SQLite doesn't handle concurrent writes well
2. **Retry fields on ContentWorkflow** — not a new table, additive columns only
3. **System user `system-cron`** — no FK constraint on AuditLog.adminId, so it works
4. **`publishAttempts` updated OUTSIDE `transitionWorkflow()`** — retry metadata ≠ workflow state
5. **Idempotent** — safe to miss a cron cycle, safe to run twice
6. **Notifications deferred to Sprint 5** — cron does NOT send notifications yet

## Test Results

- New tests: 16/16 passing
- Existing workflow tests: 33/33 passing
- Full suite: 383/389 passing (6 pre-existing failures, none related to Sprint 4)
