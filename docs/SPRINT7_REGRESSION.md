# Sprint 7 — Regression Audit

## Checklist

- [x] Existing version-history.ts NOT modified — only called
- [x] Existing AdminVersionHistoryPage.tsx changes are additive (import + state + button + dialog)
- [x] No new Prisma models or migrations
- [x] No new dependencies added
- [x] Missing `/api/admin/version-history` endpoint created (was 404)
- [x] Existing tests still pass: 403/409

## Bug Fix

- Created missing `/api/admin/version-history/route.ts` endpoint
- The `use-version-history.ts` hook was calling this endpoint but it didn't exist
- Now the version history page works correctly

## Component Safety

- RollbackConfirmDialog is a new component
- AdminVersionHistoryPage changes are additive (new import, state, button, dialog)
- No existing functionality modified
