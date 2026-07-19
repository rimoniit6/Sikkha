# Sprint 5 — Security Audit

## Authentication

- [x] Student notification API requires authentication (withAuth)
- [x] Mark-as-read only affects user's own notifications (userId check)
- [x] No cross-user notification access possible

## Data Protection

- [x] No secrets in notification content
- [x] Email provider credentials not exposed (env vars only)
- [x] Notification messages are static templates (no user input injection)

## Access Control

- [x] Students can only read their own notifications
- [x] Students can only mark their own notifications as read
- [x] Broadcast notifications create separate records per user

## Input Validation

- [x] PATCH endpoint validates ids array or markAll boolean
- [x] No SQL injection (Prisma parameterized queries)
- [x] No XSS in notification messages (escaped by React)

## Email Security

- [x] Email provider is optional (no hard dependency)
- [x] Email failures never expose stack traces
- [x] Email content uses static templates (no user-controlled HTML)

## Audit Trail

- [x] Admin notifications already logged via existing admin API
- [x] Student notification reads are not audited (low-risk operation)
