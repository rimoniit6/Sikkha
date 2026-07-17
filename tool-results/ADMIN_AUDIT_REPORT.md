# Phase 5 — Admin Panel CRUD Audit (Runtime Verification)

**App:** Sikkhs (Next.js 16 / Prisma / PostgreSQL)  **Tested:** running app at http://localhost:3000
**Admin:** admin@localhost / inp (SUPER_ADMIN)  **CSRF:** disabled locally
**Date:** 2026-07-17  **Mode:** L1 report-only (no fixes applied)

---

## Admin Health Score: 62 / 100
## Production Readiness Score: 55 / 100  (BLOCKED by Critical #1 and High #2/#3)

---

## CRITICAL

### C1. Destructive hard-delete cascade with no soft-delete / confirmation / undo
- **Modules:** classes, subjects, boards, courses, mcq-exam-packages, cq-exam-packages, users (all content).
- **Observed:** `DELETE /api/admin/classes?id=<classId>` returned 200 and **silently deleted the entire content tree** — all subjects, chapters, lectures, MCQs and CQs under that class. Verified: after deleting a subject, its chapters count dropped to 0; after deleting a board, the MCQ referencing it dropped to 0.
- **Root cause:** DELETE handlers call raw `db.<model>.delete(...)` (e.g. `src/app/api/admin/classes/route.ts:140`). The Prisma schema uses `onDelete: Cascade` at **67 relations** (schema.prisma lines 116, 135, 161, 184, 211, 228, 264, 309, 871, 893, 922, 935, 996, 1019, 1060, 1285, 1320, 1353, 1464, 1484, 1502, etc.).
- **Impact:** One misclick (or a scripted call) permanently destroys large volumes of paid content with no trash/restore, no "are you sure" server-side guard, and no automatic audit visibility (see H3).
- **DB impact:** Irreversible mass deletion across multiple tables.
- **Fix:** Introduce soft-delete (`deletedAt`) + require explicit `force`/confirmation param; replace blind cascade with guarded/selective deletes; surface confirmation in UI.

## HIGH

### H2. CQ exam package creation is broken (DB_VALIDATION_ERROR)
- **Module:** `POST /api/admin/cq-exam-packages` `action=create-package`
- **Observed:** Sending `subjectIds` as a JSON array (what the admin UI sends) returns `422 ডাটাবেস ভ্যালিডেশন ত্রুটি (DB_VALIDATION_ERROR)`. Works only if `subjectIds` is a **JSON string** `"[]"`.
- **Root cause:** `src/app/api/admin/cq-exam-packages/route.ts:299` uses `subjectIds: subjectIds || []` (raw array) but the column is `String` (schema.prisma:997, JSON stored as string). The MCQ route does it correctly: `subjectIds: subjectIds ? JSON.stringify(subjectIds) : '[]'` (mcq-exam-packages/route.ts:373).
- **Impact:** Admins cannot create CQ exam packages through the panel.
- **Fix:** Serialize `subjectIds` to JSON string before `db.create`, matching the MCQ route.

### H3. No readable audit-log API — destructive actions invisible in admin panel
- **Observed:** Audit writes are created via `auditFromRequest` (`src/lib/audit.ts`) on every content delete/update, but there is **no `/api/admin/audit-logs` route** (the `src/app/api/admin/audit-logs` directory does not exist). `GET /api/admin/audit-logs` returns a non-API HTML response.
- **Impact:** The critical deletes in C1 are logged to `db.auditLog` but cannot be viewed, filtered, or used for recovery in the UI. No admin oversight / accountability.
- **Fix:** Add a paginated, filterable `audit-logs` admin API + UI view.

### H4. Aggressive login rate-limiting can lock out admins
- **Observed:** During normal sequential testing, the login endpoint began returning `RATE_LIMITED` (code `RATE_LIMITED`) after only a handful of requests within minutes, after which all subsequent admin calls returned `UNAUTHORIZED`.
- **Impact:** Legitimate admin re-logins / automation can be blocked; risk of self-DoS on the admin account.
- **Fix:** Scope rate limits per-IP+account with a sane threshold; exclude already-authenticated sessions; add admin unlock path.

## MEDIUM

### M5. Inconsistent API response shapes & action-routing across modules
- `mcq-exam-packages`/`cq-exam-packages`/`courses` **bare GET returns `400 "Unknown action: null"`** — the list view MUST always pass `?action=list` (or `?action=`). Inconsistent with REST-style modules (subjects, mcq, notices, etc.) that list on bare GET.
- Response shape inconsistency: `create-package` → `{ data: { package } }` but `create-set` → `{ set }`. UI must special-case each.
- **Fix:** Standardize list action default (bare GET = list) and a uniform envelope.

### M6. Users: hard delete cascades all relational data
- `DELETE /api/admin/users?id=<id>` returns 200 and cascades (schema `onDelete: Cascade` on User relations) to orders, subscriptions, payments, submissions. No confirmation. Acceptable under GDPR erase, but should be an explicit, guarded, audited bulk-data erasure with confirmation.
- **Note:** User **update works correctly via PATCH** (verified 200). No POST (users are created via registration/seed, not admin API) — acceptable.

### M7. bulk-import is upload-only
- `POST /api/admin/bulk-import` requires `multipart/form-data` (500 if JSON; 405 on GET). Functional for file import but no programmatic JSON import path. UI must use file upload.

## LOW

### L8. Several modules return empty datasets
- `feature-flags` (0), `certificates` (0), `teachers` (0), `moderators` (0), `media` (0), `topics` (0), `coupons` (0). Likely unseeded, not defects — but worth confirming the admin UI handles empty states gracefully.

### L9. Mixed error localization/format
- Some errors are Bengali user strings (good), others are English technical (`Unknown action: null`, `Package ID required`). Inconsistent; standardize codes + localized messages.

---

## What was verified working
- Auth/login (SUPER_ADMIN), GET list on all REST modules (200).
- Class/Subject/Notice/Board/MCQ **create** (201), **update** (200), **delete** (200).
- MCQ exam package full lifecycle: create-package → create-set → add-questions → delete-package (works).
- CQ exam package create works **only** with string `subjectIds` (see H2).
- Courses: create (201) + delete via `PUT action=delete` (source-verified, line 479).
- User PATCH update (200), user DELETE (200).
- MCQ search / filter (subjectId) / pagination all functional.
- analytics (200), settings (200), feature-flags (200), orders/payments/subscriptions reads (200).

## Test artifacts
- `tool-results/audit-crud3.ps1`, `audit-fk.ps1`, `audit-orphan2.ps1`, `audit-pkgs3.ps1`, `audit-suite1/2/3.ps1` — PowerShell CRUD harnesses (login per session; inline `-Body` JSON; `-InFile` caused encoding 422s).

## Blocked by rate-limit at end of session
- Final course-lifecycle + CQ-set runtime confirmation was cut off by login RATE_LIMITED (H4). Course delete and CQ create-set are source-verified, not runtime-blocked.
