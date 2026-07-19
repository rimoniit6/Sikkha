# Sprint 5 — Notifications — Implementation Documentation

## Overview

Provider-based notification system with email abstraction and in-app notifications. Email is optional (returns `{ skipped: true }` if no provider). Notifications NEVER rollback workflow.

## Architecture

```
Workflow State Change
        │
        ▼
dispatchWorkflowNotifications(db, context, { emailProvider? })
        │
        ├──► In-App Notification (always — db.notification.create)
        │
        └──► Email (best-effort — returns { skipped: true } if no provider)
```

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/notification-service.ts` | CREATED | Provider abstraction + dispatch logic |
| `src/lib/__tests__/notification-service.test.ts` | CREATED | 14 unit tests |
| `src/app/api/student/notifications/route.ts` | CREATED | Student notification API (GET + PATCH) |
| `src/components/notifications/NotificationBell.tsx` | CREATED | Header bell with dropdown |
| `src/hooks/student/use-notifications.ts` | CREATED | React Query hooks |
| `src/components/layout/Header.tsx` | MODIFIED | Integrated NotificationBell |
| `src/lib/query-keys.ts` | MODIFIED | Added notification query keys |

## Service API

### `createInAppNotification(db, notification)`
Creates a single in-app notification for a specific user.

### `createBroadcastNotification(db, notification)`
Creates in-app notifications for all students.

### `sendEmailNotification(provider, params)`
Sends email if provider is configured. Returns `{ skipped: true }` if no provider — NOT an error.

### `dispatchWorkflowNotifications(db, context, options?)`
Main entry point for workflow state change notifications.
- In-app: always created (for content owner)
- Email: best-effort (skipped if no provider)
- Never throws on failure — workflow is NOT rolled back

## Auth

- **GET /api/student/notifications**: Returns notifications for authenticated student
- **PATCH /api/student/notifications**: Mark notification(s) as read

## Key Design Decisions

1. **Email is optional** — `sendEmailNotification()` returns `{ skipped: true }` when no provider
2. **Never rollback workflow** — notification failures are caught and logged, never thrown
3. **In-app is guaranteed** — always created if userId is provided
4. **Polling for unread count** — `useUnreadNotificationCount()` polls every 30s
5. **Bengali locale** — all UI text and notification messages in Bengali

## Test Results

- New tests: 14/14 passing
- Existing workflow tests: 33/33 passing
- Full suite: 397/403 passing (6 pre-existing failures)
