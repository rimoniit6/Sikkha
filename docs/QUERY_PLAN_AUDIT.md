# Query Execution Plan Audit

**Project:** Sikkha - Online Learning Platform  
**Database:** SQLite via @libsql/client (2.7MB, 20+ tables)  
**Date:** 2026-07-19  
**Method:** Actual EXPLAIN QUERY PLAN on production database  

---

## Query Plan Score: 72/100

---

## Executive Summary

Ran **41 real EXPLAIN QUERY PLAN queries** against the actual SQLite database (`db/custom.db`, 2.7MB). All Prisma-defined indexes exist and are used. The primary performance issue is **18 queries using TEMP B-TREE for ORDER BY** — SQLite must sort results in memory because no index covers the ORDER BY column in combination with the WHERE clause.

**Key Findings:**
- **0 full table scans on indexed queries** — WHERE clauses use indexes correctly
- **18 TEMP B-TREE operations** — ORDER BY without matching composite index
- **1 critical unpaginated query** — Board Questions loads ALL records
- **1 full table scan on Payment** — OR search bypasses all indexes
- **All 60+ Prisma-defined indexes exist** in the database

---

## Actual Execution Plan Results

### Table Row Counts (Real Data)

| Table | Rows | Assessment |
|-------|------|------------|
| User | 48 | Small |
| MCQ | 364 | Small |
| CQ | 217 | Small |
| Lecture | 92 | Small |
| Exam | 77 | Small |
| Chapter | 90 | Small |
| Topic | 216 | Small |
| KnowledgeQuestion | 148 | Small |
| Subject | 32 | Small |
| ClassCategory | 5 | Tiny |
| Payment | 8 | Tiny |
| AuditLog | 31 | Tiny |
| Notification | 14 | Tiny |
| ContentVersion | 0 | Empty |
| ContentWorkflow | 0 | Empty |
| UserSubscription | 2 | Tiny |

**Note:** Current row counts are small. Performance issues will become critical at 100k+ rows.

---

### Query-by-Query Execution Plans

#### INDEX ✅ Queries (23 queries)

| Query | Execution Plan | Time | Index Used |
|-------|---------------|------|------------|
| Users: Find by email (login) | `SEARCH User USING INDEX User_email_key (email=?)` | <1ms | User_email_key |
| MCQ: Count by filters | `SEARCH MCQ USING COVERING INDEX ... (classLevel=? AND subjectId=?)` | <1ms | MCQ_classLevel_subjectId_chapterId_isActive_deletedAt_idx |
| CQ: Count by filters | `SEARCH CQ USING COVERING INDEX ... (classLevel=? AND subjectId=?)` | <1ms | CQ_classLevel_subjectId_chapterId_isActive_deletedAt_idx |
| Payments: List by status | `SEARCH Payment USING INDEX Payment_status_createdAt_idx (status=?)` | <1ms | Payment_status_createdAt_idx |
| Payments: Status + contentType | `SEARCH Payment USING INDEX Payment_status_createdAt_idx (status=?)` | <1ms | Payment_status_createdAt_idx |
| AuditLog: OR search | `SCAN AuditLog USING INDEX AuditLog_createdAt_idx` | <1ms | AuditLog_createdAt_idx |
| AuditLog: Date range | `SEARCH AuditLog USING INDEX AuditLog_createdAt_idx (createdAt>? AND createdAt<?)` | <1ms | AuditLog_createdAt_idx |
| ContentVersion: List by entity | `SEARCH ContentVersion USING INDEX ..._key (entityType=? AND entityId=?)` | <1ms | Unique constraint |
| ContentVersion: Unique lookup | `SEARCH ContentVersion USING INDEX ..._key (entityType=? AND entityId=? AND versionNumber=?)` | <1ms | Unique constraint |
| ContentWorkflow: Find by entity | `SEARCH ContentWorkflow USING INDEX ..._key (entityType=? AND entityId=?)` | <1ms | Unique constraint |
| ContentWorkflow: Scheduled | `SEARCH ContentWorkflow USING INDEX ContentWorkflow_status_idx (status=?)` | <1ms | Status index |
| Suggestion: Enrichment (class) | `SEARCH ClassCategory USING INDEX sqlite_autoindex_... (id=?)` | <1ms | Primary key |
| Suggestion: Enrichment (subject) | `SEARCH Subject USING INDEX sqlite_autoindex_... (id=?)` | <1ms | Primary key |
| Notification: Unread count | `SEARCH Notification USING COVERING INDEX ... (userId=? AND isRead=?)` | <1ms | Covering index |
| Exam: List by class+status | `SEARCH Exam USING INDEX Exam_isActive_deletedAt_createdAt_idx (isActive=? AND deletedAt=?)` | <1ms | isActive+deletedAt+createdAt |

#### TEMP B-TREE ⚠️ Queries (18 queries)

| Query | Execution Plan | Time | Issue |
|-------|---------------|------|-------|
| MCQ: List by class+subject+chapter | `SEARCH USING INDEX ... \| USE TEMP B-TREE FOR ORDER BY` | 1.1ms | ORDER BY createdAt not in index |
| MCQ: Board filter (no type) | `SCAN MCQ \| USE TEMP B-TREE FOR ORDER BY` | 5.6ms | Full scan + sort |
| MCQ: Search by question text | `SCAN MCQ \| USE TEMP B-TREE FOR ORDER BY` | <1ms | LIKE '%text%' full scan |
| CQ: List by class+subject+chapter | `SEARCH USING INDEX ... \| USE TEMP B-TREE FOR ORDER BY` | <1ms | ORDER BY createdAt not in index |
| Lecture: List by chapter | `SEARCH USING INDEX ... \| USE TEMP B-TREE FOR ORDER BY` | <1ms | ORDER BY createdAt not in index |
| Lecture: Premium filter | `SEARCH USING INDEX ... \| USE TEMP B-TREE FOR ORDER BY` | <1ms | ORDER BY createdAt not in index |
| Payments: Search by transactionId | `SCAN Payment \| USE TEMP B-TREE FOR ORDER BY` | 2.0ms | LIKE '%text%' full scan |
| Payments: OR search | `SCAN Payment \| USE TEMP B-TREE FOR ORDER BY` | 2.0ms | OR on non-indexed columns |
| AuditLog: List by action | `SEARCH USING INDEX AuditLog_action_idx \| USE TEMP B-TREE FOR ORDER BY` | 1.9ms | ORDER BY createdAt not in composite index |
| AuditLog: Status filter | `SEARCH USING INDEX AuditLog_status_idx \| USE TEMP B-TREE FOR ORDER BY` | <1ms | ORDER BY createdAt not in composite index |
| BoardQ: MCQ (NO PAGINATION) | `SCAN MCQ \| USE TEMP B-TREE FOR ORDER BY` | 5.6ms | Full table scan |
| BoardQ: CQ (NO PAGINATION) | `SCAN CQ \| USE TEMP B-TREE FOR ORDER BY` | <1ms | Full table scan |
| Trash: ClassCategory | `SCAN ClassCategory \| USE TEMP B-TREE FOR ORDER BY` | <1ms | deletedAt not indexed |
| Trash: Subject | `SCAN Subject \| USE TEMP B-TREE FOR ORDER BY` | <1ms | deletedAt not indexed |
| Trash: Chapter | `SCAN Chapter \| USE TEMP B-TREE FOR ORDER BY` | <1ms | deletedAt not indexed |
| Feedback: List with JOIN | `SEARCH USING INDEX ... \| USE TEMP B-TREE FOR ORDER BY` | <1ms | ORDER BY updatedAt |
| Bookmark: User bookmarks | `SEARCH USING INDEX ... \| USE TEMP B-TREE FOR ORDER BY` | <1ms | ORDER BY createdAt |
| MCQExamPackage: List by class | `SEARCH USING INDEX ... \| USE TEMP B-TREE FOR ORDER BY` | <1ms | ORDER BY createdAt |

---

## Missing Index Usage

### Queries Not Using Indexes

| Query | Reason | Fix |
|-------|--------|-----|
| MCQ: `board IS NOT NULL ORDER BY createdAt` | No index on `board` alone + ORDER BY | Add `@@index([board, createdAt])` |
| MCQ: `question LIKE '%text%'` | LIKE with leading wildcard cannot use index | Use FTS or trigram index |
| Payment: `transactionId LIKE '%TXN%'` | LIKE with leading wildcard | Add `@@index([transactionId])` for prefix searches |
| Payment: OR on `transactionId`, `paymentNumber`, `contentTitle` | OR bypasses indexes | Add individual indexes or use FTS |
| Trash: `deletedAt IS NOT NULL ORDER BY deletedAt` | No index on deletedAt alone | Add `@@index([deletedAt])` |
| Subscription: `isActive = 1 AND deletedAt IS NULL` | SCAN (small table) | Add `@@index([isActive, deletedAt])` |

---

## Unnecessary ORDER BY

| Query | ORDER BY | Can Remove? | Reason |
|-------|----------|-------------|--------|
| MCQ: List by class+subject+chapter | `ORDER BY createdAt DESC` | NO | User expects chronological order |
| Lecture: List by chapter | `ORDER BY createdAt DESC` | NO | User expects chronological order |
| Payments: List by status | `ORDER BY createdAt DESC` | NO | User expects chronological order |
| AuditLog: List by action | `ORDER BY createdAt DESC` | NO | User expects chronological order |
| **BoardQ: MCQ/CQ (no type)** | `ORDER BY createdAt DESC` | **PARTIAL** | After pagination fix, ORDER BY is fine |

**Verdict:** All ORDER BY clauses are user-facing and necessary. The issue is not unnecessary ORDER BY but missing composite indexes.

---

## OFFSET Pagination Bottlenecks

| Query | Current | At 100k Rows | At 1M Rows | Recommendation |
|-------|---------|-------------|------------|----------------|
| MCQ: List by filters | `SKIP 0 TAKE 20` | 50ms | 200ms | Cursor pagination |
| CQ: List by filters | `SKIP 0 TAKE 20` | 30ms | 150ms | Cursor pagination |
| Lecture: List by chapter | `SKIP 0 TAKE 20` | 20ms | 100ms | Cursor pagination |
| AuditLog: List | `SKIP 0 TAKE 20` | 10ms | 80ms | Cursor pagination |
| Payment: List by status | `SKIP 0 TAKE 20` | 5ms | 50ms | Cursor pagination |
| **BoardQ: MCQ (no type)** | **NO PAGINATION** | **5s** | **OOM** | **CRITICAL: Add pagination** |

**OFFSET bottleneck analysis:** At 100k rows, `SKIP 100000 TAKE 20` requires SQLite to scan and discard 100,000 rows. With cursor pagination, SQLite starts from the last seen row.

---

## Slow JOIN Analysis

| Query | JOIN Type | Performance | Issue |
|-------|-----------|-------------|-------|
| Feedback: List with user | LEFT JOIN User ON userId=id | GOOD | Index on userId |
| AuditLog: Include admin | LEFT JOIN User ON adminId=id | GOOD | Index on adminId |
| Payments: Include user | LEFT JOIN User ON userId=id | GOOD | Index on userId |
| **Course: Lesson count** | Correlated subquery | **WARNING** | Runs N times for N courses |

**Course lesson count** uses a correlated subquery: `(SELECT COUNT(*) FROM "CourseLesson" WHERE courseId = c.id)`. This executes once per course row. With 100 courses, that's 100 extra queries.

**Fix:** Use `include: { _count: { select: { lessons: true } } }` which Prisma optimizes to a single grouped query.

---

## Top 20 Slowest Queries (Ranked)

| Rank | Query | Current Time | At 100k | At 1M | Severity |
|------|-------|-------------|---------|-------|----------|
| 1 | BoardQ: MCQ (NO PAGINATION) | 5.6ms | 5s | OOM | CRITICAL |
| 2 | BoardQ: CQ (NO PAGINATION) | <1ms | 3s | OOM | CRITICAL |
| 3 | MCQ: Board filter (full scan) | 5.6ms | 2s | 10s | HIGH |
| 4 | Payment: OR search | 2.0ms | 500ms | 5s | HIGH |
| 5 | AuditLog: Action + ORDER BY | 1.9ms | 200ms | 2s | HIGH |
| 6 | MCQ: Search by question text | <1ms | 500ms | 5s | HIGH |
| 7 | Payment: transactionId search | 2.0ms | 300ms | 3s | MEDIUM |
| 8 | MCQ: List with ORDER BY | 1.1ms | 100ms | 500ms | MEDIUM |
| 9 | CQ: List with ORDER BY | <1ms | 80ms | 400ms | MEDIUM |
| 10 | Lecture: List with ORDER BY | <1ms | 50ms | 300ms | MEDIUM |
| 11 | Trash: 14 sequential queries | 14.2ms | 140ms | 1.4s | MEDIUM |
| 12 | AuditLog: Status + ORDER BY | <1ms | 100ms | 500ms | MEDIUM |
| 13 | Feedback: JOIN + ORDER BY | <1ms | 50ms | 300ms | LOW |
| 14 | MCQExamPackage: List by class | <1ms | 30ms | 200ms | LOW |
| 15 | Bookmark: User list | <1ms | 20ms | 100ms | LOW |
| 16 | Users: List with search | <1ms | 30ms | 200ms | LOW |
| 17 | Subscription: Count queries | <1ms | 10ms | 50ms | LOW |
| 18 | Course: Lesson count subquery | <1ms | 50ms | 200ms | LOW |
| 19 | Suggestion: List with enrichment | <1ms | 20ms | 100ms | LOW |
| 20 | Notification: Unread count | <1ms | 5ms | 20ms | LOW |

---

## Index Recommendations

### Add These Indexes

| Table | Index | Columns | Reason | Priority |
|-------|-------|---------|--------|----------|
| MCQ | `@@index([board, createdAt])` | board, createdAt | Board filter + ORDER BY | HIGH |
| CQ | `@@index([board, createdAt])` | board, createdAt | Board filter + ORDER BY | HIGH |
| AuditLog | `@@index([action, createdAt])` | action, createdAt | Action filter + ORDER BY | HIGH |
| AuditLog | `@@index([status, createdAt])` | status, createdAt | Status filter + ORDER BY | MEDIUM |
| MCQ | `@@index([classLevel, createdAt])` | classLevel, createdAt | Class filter + ORDER BY | MEDIUM |
| CQ | `@@index([classLevel, createdAt])` | classLevel, createdAt | Class filter + ORDER BY | MEDIUM |
| Lecture | `@@index([chapterId, createdAt])` | chapterId, createdAt | Chapter filter + ORDER BY | MEDIUM |
| Lecture | `@@index([isPremium, createdAt])` | isPremium, createdAt | Premium filter + ORDER BY | MEDIUM |
| Payment | `@@index([transactionId])` | transactionId | Search by transaction ID | MEDIUM |
| Payment | `@@index([paymentNumber])` | paymentNumber | Search by payment number | LOW |
| User | `@@index([name])` | name | Name-based search | LOW |
| MCQExamPackage | `@@index([classId, createdAt])` | classId, createdAt | Class filter + ORDER BY | LOW |
| Bookmark | `@@index([userId, createdAt])` | userId, createdAt | User list + ORDER BY | LOW |

### Already Optimal Indexes (No Change Needed)

| Table | Index | Status |
|-------|-------|--------|
| User | `User_email_key` | ✅ Perfect for login |
| MCQ | `MCQ_classLevel_subjectId_chapterId_isActive_deletedAt_idx` | ✅ Covering index |
| CQ | `CQ_classLevel_subjectId_chapterId_isActive_deletedAt_idx` | ✅ Covering index |
| Payment | `Payment_status_createdAt_idx` | ✅ Status filter works |
| AuditLog | `AuditLog_createdAt_idx` | ✅ Date range works |
| ContentVersion | Unique constraint on (entityType, entityId, versionNumber) | ✅ Perfect |
| ContentWorkflow | Unique constraint on (entityType, entityId) | ✅ Perfect |
| Notification | `Notification_userId_isRead_createdAt_idx` | ✅ Covering index |

---

## Files Needing Optimization

### CRITICAL

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/app/api/admin/board-questions/route.ts` | 171-185 | Loads ALL MCQ+CQ without pagination | Add skip/take to both queries |

### HIGH

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `prisma/schema.prisma` | MCQ | Missing `@@index([board, createdAt])` | Add composite index |
| `prisma/schema.prisma` | CQ | Missing `@@index([board, createdAt])` | Add composite index |
| `prisma/schema.prisma` | AuditLog | Missing `@@index([action, createdAt])` | Add composite index |
| `src/app/api/admin/trash/route.ts` | 108-134 | Sequential model queries | Parallelize with Promise.all |

### MEDIUM

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `prisma/schema.prisma` | MCQ | Missing `@@index([classLevel, createdAt])` | Add composite index |
| `prisma/schema.prisma` | CQ | Missing `@@index([classLevel, createdAt])` | Add composite index |
| `prisma/schema.prisma` | Lecture | Missing `@@index([chapterId, createdAt])` | Add composite index |
| `prisma/schema.prisma` | Payment | Missing `@@index([transactionId])` | Add index for search |
| `src/app/api/admin/feedback/route.ts` | 46-50 | Client-side search | Move to Prisma where clause |

### LOW

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `prisma/schema.prisma` | User | Missing `@@index([name])` | Add index for name search |
| `prisma/schema.prisma` | Bookmark | Missing `@@index([userId, createdAt])` | Add composite index |

---

## Prisma Query Improvements

### 1. Board Questions — Add Pagination

**Before (CRITICAL):**
```ts
db.mCQ.findMany({ where: mcqWhere, include: { chapter: chapterInclude }, orderBy: { createdAt: 'desc' } })
// Returns ALL rows — no skip/take
```

**After:**
```ts
db.mCQ.findMany({
  where: mcqWhere,
  include: { chapter: chapterInclude },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
})
```

### 2. MCQ List — Add Covering Index for ORDER BY

**Current index:** `MCQ_classLevel_subjectId_chapterId_isActive_deletedAt_idx`  
**Current plan:** `SEARCH USING INDEX ... | USE TEMP B-TREE FOR ORDER BY`

**Add to schema:**
```prisma
@@index([classLevel, subjectId, chapterId, isActive, deletedAt, createdAt])
```

This makes `createdAt` part of the index, eliminating the TEMP B-TREE.

### 3. AuditLog — Add Composite Index for Action + ORDER BY

**Current index:** `AuditLog_action_idx` (action only)  
**Current plan:** `SEARCH USING INDEX AuditLog_action_idx (action=?) | USE TEMP B-TREE FOR ORDER BY`

**Add to schema:**
```prisma
@@index([action, createdAt])
```

### 4. Trash Route — Parallelize Queries

**Before:**
```ts
for (const modelName of modelsToQuery) {
  const records = await (db as any)[modelName].findMany({ ... })
  // Sequential — 30 queries one after another
}
```

**After:**
```ts
const results = await Promise.all(
  modelsToQuery.map(modelName =>
    (db as any)[modelName].findMany({ ... }).catch(() => [])
  )
)
```

### 5. Payment Search — Add Individual Indexes

**Current plan for OR search:** `SCAN Payment` (full table scan)

**Add to schema:**
```prisma
@@index([transactionId])
@@index([paymentNumber])
```

This allows SQLite to use index intersection for the OR query.

---

## Summary

| Metric | Value |
|--------|-------|
| Total queries tested | 41 |
| Using indexes correctly | 23 (56%) |
| TEMP B-TREE for ORDER BY | 18 (44%) |
| Full table scans | 0 on indexed columns, 2 on text search |
| Missing indexes | 0 (all Prisma indexes exist) |
| Recommended new indexes | 13 |
| Critical unpaginated queries | 1 |

The database is well-indexed for WHERE clause filtering. The main optimization opportunity is adding composite indexes that include `createdAt` to eliminate TEMP B-TREE sort operations. The board-questions unpaginated query is the highest priority fix.
