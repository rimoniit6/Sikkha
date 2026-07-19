# Sprint 4 — Security Audit

## Authentication

- [x] Cron endpoint protected by CRON_SECRET or admin auth
- [x] No bypass possible — both paths require valid credentials
- [x] CRON_SECRET is read from environment variable (not hardcoded)

## Data Protection

- [x] No secrets logged in error messages
- [x] `publishError` stored in DB (not exposed to client in error responses)
- [x] No SQL injection — Prisma parameterized queries used throughout
- [x] No user input accepted from cron endpoint (GET/POST with no body)

## Rate Limiting

- [x] Admin manual triggers go through `withAdmin()` which includes rate limiting
- [x] Vercel Cron triggers are not rate-limited (intentional — cron runs every minute)
- [x] Sequential processing prevents thundering herd on DB

## Access Control

- [x] Cron endpoint requires either CRON_SECRET or admin session
- [x] No public access to the endpoint
- [x] System user `system-cron` is used for audit (not a real user)

## Input Validation

- [x] No user input accepted from cron endpoint
- [x] `dryRun` option is boolean-only (no injection possible)
- [x] Entity types and IDs come from DB (not user input)

## Audit Trail

- [x] All transitions logged via `createAuditLog()` with `WORKFLOW_PUBLISH` action
- [x] System user `system-cron` is recorded as the actor
- [x] Timestamp and IP recorded for each transition

## Recommendations

- [ ] Store `CRON_SECRET` in Vercel environment variables (not in code)
- [ ] Monitor failed publish attempts via admin dashboard
- [ ] Set up alerts for repeated `publishFailedAt` events
