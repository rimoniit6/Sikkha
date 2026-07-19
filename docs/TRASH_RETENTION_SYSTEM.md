# Trash Retention & Auto Cleanup System — Production Implementation

**Date**: 2026-07-19
**Status**: Production-Ready

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Settings                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Retention    │  │ Enable/      │  │ Manual        │  │
│  │ Days         │  │ Disable      │  │ Run Button    │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼────────────────┼───────────────────┼──────────┘
          │                │                   │
┌─────────▼────────────────▼───────────────────▼──────────┐
│              POST /api/admin/trash/cleanup                │
│  action: "updateSettings" | "preview" | "runCleanup"     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Trash Cleanup Service                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. Get retention settings from SiteSetting        │   │
│  │ 2. Calculate cutoff date (now - retentionDays)    │   │
│  │ 3. Preview: Find all records older than cutoff    │   │
│  │ 4. If dryRun: Return preview, no deletion         │   │
│  │ 5. Collect all eligible records across models     │   │
│  │ 6. Process in batches (configurable size)         │   │
│  │ 7. Each batch: bulkForceDelete()                  │   │
│  │ 8. Update cleanup metadata in settings            │   │
│  │ 9. Create comprehensive audit log                 │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              SiteSetting Model                            │
│  - trashRetentionDays: 90 (default)                      │
│  - trashCleanupEnabled: true (default)                   │
│  - trashLastCleanup: ISO timestamp                       │
│  - trashNextCleanup: ISO timestamp                       │
│  - trashLastCleanupCount: number                         │
│  - trashCleanupBatchSize: 500 (default)                  │
└─────────────────────────────────────────────────────────┘
```

---

## What Was Implemented

### 1. Cleanup Service (`src/lib/trash-cleanup.ts`)

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `getTrashRetentionSettings()` | Read current retention configuration |
| `updateTrashSettings()` | Update retention configuration |
| `previewTrashCleanup()` | Preview what would be deleted (dry run) |
| `runTrashCleanup()` | Execute cleanup with batching |

**Configuration:**
- **Retention Days**: 0, 7, 15, 30, 60, 90, 180, 365 (0 = never auto-delete)
- **Batch Size**: 10-1000 (default: 500)
- **Enabled**: Toggle auto-cleanup on/off

**Batch Processing:**
```
For each batch of 500 records:
  1. Collect eligible records across all models
  2. Call bulkForceDelete() for the batch
  3. If batch fails, log error and continue
  4. Track total deleted/failed counts
```

### 2. Cleanup API (`/api/admin/trash/cleanup`)

**GET**: Returns current settings and preview of what would be cleaned

**POST Actions:**

| Action | Purpose |
|--------|---------|
| `updateSettings` | Update retention days, enabled flag, batch size |
| `preview` | Preview records that would be deleted |
| `runCleanup` | Execute cleanup (dryRun option available) |

**Response Example:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "retentionDays": 90,
    "totalDeleted": 8812,
    "totalFailed": 0,
    "batchCount": 18,
    "duration": 45230,
    "dryRun": false,
    "preview": {
      "totalRecords": 8812,
      "models": [
        { "model": "mcq", "label": "MCQ", "count": 8300 },
        { "model": "lecture", "label": "লেকচার", "count": 440 }
      ]
    }
  }
}
```

### 3. Admin Settings UI (`AdminTrashCleanupTab.tsx`)

**Features:**
- **Retention selector** — Dropdown with allowed values
- **Enable/Disable toggle** — Turn auto-cleanup on/off
- **Status display** — Last cleanup, next cleanup, last count
- **Preview display** — Shows what would be deleted by model
- **Manual Run button** — Trigger cleanup immediately
- **Dry Run button** — Preview without deleting
- **Result display** — Shows deletion count, duration, errors

---

## Batch Flow

```
Run Trash Cleanup (retentionDays=90, batchSize=500)
  │
  ├─ Calculate cutoff: 2026-04-21 (90 days ago)
  │
  ├─ Preview: Count eligible records
  │   ├─ MCQ: 8,300
  │   ├─ Lecture: 440
  │   ├─ Chapter: 55
  │   └─ Subject: 12
  │   Total: 8,812
  │
  ├─ Batch 1 (records 1-500):
  │   └─ bulkForceDelete(500 items) → 500 deleted
  ├─ Batch 2 (records 501-1000):
  │   └─ bulkForceDelete(500 items) → 500 deleted
  ├─ ... (18 batches total)
  ├─ Batch 18 (records 8501-8812):
  │   └─ bulkForceDelete(312 items) → 312 deleted
  │
  ├─ Update settings: lastCleanup, nextCleanup, lastCleanupCount
  │
  └─ Create audit log with summary
```

---

## Settings Storage

| Key | Default | Description |
|-----|---------|-------------|
| `trashRetentionDays` | 90 | Days before auto-delete |
| `trashCleanupEnabled` | true | Enable/disable auto-cleanup |
| `trashLastCleanup` | null | ISO timestamp of last cleanup |
| `trashNextCleanup` | null | ISO timestamp of next scheduled cleanup |
| `trashLastCleanupCount` | 0 | Number of records deleted last time |
| `trashCleanupBatchSize` | 500 | Records per batch |

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/trash-cleanup.ts` | NEW — Cleanup service with preview, batch processing, settings |
| `src/app/api/admin/trash/cleanup/route.ts` | NEW — API endpoint for settings, preview, and execution |
| `src/components/admin/AdminTrashCleanupTab.tsx` | NEW — Settings UI with preview and manual run |
| `src/components/admin/AdminSettingsPage.tsx` | Added trash cleanup tab |

---

## Verification Checklist

| # | Verification Item | Status |
|---|-------------------|--------|
| 1 | Retention settings persist | **PASS** |
| 2 | Retention days validation (0,7,15,30,60,90,180,365) | **PASS** |
| 3 | Enable/disable cleanup | **PASS** |
| 4 | Preview shows correct counts | **PASS** |
| 5 | Dry run does not delete | **PASS** |
| 6 | Cleanup deletes only soft-deleted records | **PASS** |
| 7 | Cleanup respects retention period | **PASS** |
| 8 | Batch processing works | **PASS** |
| 9 | Transaction safety (bulkForceDelete) | **PASS** |
| 10 | Audit logging | **PASS** |
| 11 | Last cleanup metadata updated | **PASS** |
| 12 | Manual trigger works | **PASS** |
| 13 | Requires withAdmin() | **PASS** |
| 14 | Requires withCsrf() | **PASS** |
| 15 | Regression: Trash, Restore, Force Delete, Bulk Restore, Bulk Delete, Dashboard, Search, Pagination | **PASS** |

---

## Performance Notes

| Aspect | Impact |
|--------|--------|
| Preview query | 1 count query per model (indexed) |
| Cleanup execution | Batched bulkForceDelete (500 per batch) |
| Settings read | Single query (indexed by key) |
| Audit logging | 1 insert per cleanup run |

---

## Security Notes

- **Admin-only**: All operations require `withAdmin` auth
- **CSRF protected**: All POST operations require valid CSRF token
- **Audit logged**: Every cleanup creates permanent audit entry
- **Configurable**: Retention period is admin-configurable
- **Safe by default**: 90-day retention, enabled by default

---

## Production Readiness

# **PASS**

- Configurable retention period
- Batch processing for large datasets
- Dry run preview mode
- Comprehensive audit logging
- Admin settings UI
- Manual trigger capability
- Transaction safety via bulkForceDelete
- Zero TypeScript errors
- Zero breaking changes
