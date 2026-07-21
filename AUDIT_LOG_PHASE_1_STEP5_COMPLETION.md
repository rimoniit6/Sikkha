# Phase 1 — Step 5 Completion Report

**Step Name:** H6 — Fix Login Route Audit (wrong actor for failed login)  
**Date:** July 20, 2026  
**Status:** ✅ COMPLETE

---

## Completed Tasks

| Task | Status |
|---|---|
| Use `user.id` instead of `'system'` when user exists (wrong password case) | ✅ |
| Add `userName`/`userRole` enrichment for failed login when user exists | ✅ |
| Keep `'system'` fallback only when email doesn't match any account | ✅ |
| ESLint verification | ✅ Passed |
| All tests pass (0 new failures, 13 pre-existing baseline unchanged) | ✅ Passed |
| Code review | ✅ Approved |

---

## Modified Files

| File | Change |
|---|---|
| `src/app/api/auth/login/route.ts` | Failed login audit now uses `user?.id || 'system'` + enriched with `userName`/`userRole` |

---

## Database Changes

**None.**

---

## API Changes

**None.** The API response is unchanged — only the audit log data improved.

---

## Audit Log Changes

| Aspect | Before | After |
|---|---|---|
| Failed login — user exists, wrong password | `adminId: 'system'` | `adminId: user.id` (actual user) |
| Failed login — email not found | `adminId: 'system'` | `adminId: 'system'` (unchanged fallback) |
| Failed login — enrichment | None | `userName`, `userRole` when user exists |
| Successful login | Unchanged | Unchanged |

## Pattern Consistency

Matches the Step 1 (logout fix) pattern:
- Extract available identity info → use it in audit
- Fall back to generic identifiers when unavailable

---

## Tests Executed

| Check | Result |
|---|---|
| ESLint (`src/app/api/auth/login/route.ts`) | ✅ 0 errors, 0 warnings |
| Full test suite (`npm test`) | ✅ 13 pre-existing failures (all in `purchase.service.test.ts` — status casing mismatch, unrelated) |
| Code review | ✅ Approved — no issues found |

---

## Known Issues

None.

---

## Breaking Changes

**None.** Only the audit log content improved; API response unchanged.

---

## Rollback Steps

1. Revert the change in `src/app/api/auth/login/route.ts`
2. Verify: `npx eslint src/app/api/auth/login/route.ts`

---

## Production Risk

**LOW.** Minimal change — only the failed-login audit log data improved. The `user` object is already fetched from the DB and available in scope. No new DB queries, no new dependencies, no API response changes.
