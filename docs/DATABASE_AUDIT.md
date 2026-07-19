# Database Audit Report

**Project:** Sikkha - Online Learning Platform  
**Database:** SQLite via Prisma 7 + libSQL adapter  
**Date:** 2026-07-19  
**Auditor:** MiMoCode Production Audit  

---

## Executive Summary

The Prisma schema is well-designed with 50+ models, comprehensive indexes, and proper foreign key relationships. Soft-delete is implemented at the ORM extension level. Key concerns are SQLite-specific limitations for production scaling and the lack of migration files.

**Overall Database Score: 89/100**

---

## Findings

### PASS — Schema Design

| Area | Status | Evidence |
|------|--------|----------|
| Model count | PASS | 50+ models covering all domain entities |
| Relations | PASS | Foreign keys defined on all relational models |
| Unique constraints | PASS | `@@unique` on composite keys (e.g., `[entityType, entityId]`) |
| Indexes | PASS | Comprehensive `@@index` on query-heavy fields |
| Default values | PASS | Sensible defaults on all optional fields |
| Soft delete fields | PASS | `deletedAt`, `deletedBy`, `deleteReason` on all deletable models |

### PASS — Indexes

| Model | Indexed Fields | Assessment |
|-------|----------------|------------|
| User | role, classLevel+board | PASS |
| Payment | userId+status+contentType, entityType+entityId | PASS |
| Lecture | chapterId, classLevel, isPremium, isActive | PASS |
| MCQ | chapterId, classLevel, subjectId, isPremium | PASS |
| ContentWorkflow | status, scheduledAt, entityType+status | PASS |
| WorkflowHistory | entityType+entityId, toStatus, performedBy, createdAt | PASS |
| ContentVersion | entityType+entityId, createdAt, performedBy, changeType | PASS |
| AuditLog | adminId, entityType+entityId, action, createdAt, status | PASS |

### PASS — Cascade Behavior

| Pattern | Status | Evidence |
|---------|--------|----------|
| Delete cascade | PASS | `onDelete: Cascade` on dependent models |
| Soft delete cascade | PASS | `CASCADE_RULES` in `soft-delete.ts` defines parent→child cascade |
| Transaction atomicity | PASS | `$transaction` used in workflow, rollback, bulk operations |

### WARNING — SQLite Limitations

| Issue | Severity | Evidence |
|-------|----------|----------|
| No concurrent writes | Medium | SQLite serializes writes; adequate for single-instance |
| No connection pooling | Medium | libSQL adapter handles this but has limits |
| No JSON query operators | Low | JSON fields stored as strings, queried via Prisma |
| No full-text search | Low | Search uses Prisma `contains` (slow on large datasets) |
| File-based database | Low | `DATABASE_URL=file:./db/custom.db` — not suitable for multi-instance |

**Medium Finding:** SQLite is fine for development and small-to-medium production loads. For scaling beyond ~100 concurrent users, plan migration to PostgreSQL.

### WARNING — Missing Migrations

| Issue | Severity | Evidence |
|-------|----------|----------|
| No migration files | Medium | `prisma/migrations/` directory not found |
| Schema push only | Medium | `db:push` script, no `migrate deploy` workflow |

**Medium Finding:** Using `prisma db push` instead of migrations means no version-controlled schema history. This makes rollback and CI/CD harder.

### PASS — Data Integrity

| Area | Status | Evidence |
|------|--------|----------|
| Unique constraints | PASS | Email, slugs, composite keys all use `@unique` or `@@unique` |
| Foreign keys | PASS | All relations have `@relation(fields, references)` |
| Required fields | PASS | Critical fields are non-nullable |
| Cascade deletes | PASS | `onDelete: Cascade` on dependent models |
| Soft delete filter | PASS | Prisma extension auto-filters `deletedAt: null` |

### PASS — Transaction Usage

| Area | Status | Evidence |
|------|--------|----------|
| Workflow transitions | PASS | All side effects in single `$transaction` |
| Rollback operations | PASS | `rollbackVersion()` uses `$transaction` with `maxWait: 15000, timeout: 30000` |
| Bulk operations | PASS | `bulkForceDelete()` and `bulkRestore()` use transactions |
| Safe transaction wrapper | PASS | `safeTransaction()` with retry logic for transient failures |

### WARNING — N+1 Query Patterns

| Area | Status | Evidence |
|------|--------|----------|
| Batch access check | PASS | `batchCheckContentAccess()` resolves class levels in batch |
| Individual access check | WARNING | `checkContentAccess()` does multiple sequential queries per item |
| Content listing | PASS | Most list queries use `select` and proper includes |

### PASS — Raw SQL Usage

| Area | Status | Evidence |
|------|--------|----------|
| Raw SQL | PASS | Only used for health check: `db.$queryRaw\`SELECT 1\`` |
| Prisma Client | PASS | All queries go through Prisma Client |

---

## Score Breakdown

| Area | Score |
|------|-------|
| Schema Design | 95/100 |
| Indexes | 93/100 |
| Cascade Behavior | 94/100 |
| Data Integrity | 96/100 |
| Transaction Safety | 95/100 |
| Migration Strategy | 70/100 |
| Production Readiness | 82/100 |

**Final Score: 89/100**

---

## Critical Issues: 0
## Medium Issues: 2 (SQLite scaling, missing migrations)
## Low Issues: 3 (N+1 patterns, JSON queries, full-text search)
