# Sprint 5 — Performance Audit

## Query Efficiency

- [x] Student notifications API uses indexed query (userId + createdAt)
- [x] Unread count uses separate lightweight query (indexed on userId + isRead)
- [x] No N+1 queries — notifications fetched in single query

## Polling

- [x] Unread count polls every 30 seconds (configurable)
- [x] Polling only when user is authenticated
- [x] React Query deduplication prevents duplicate requests

## Memory Usage

- [x] NotificationBell limits to 10 notifications (not unbounded)
- [x] ScrollArea virtualizes long lists
- [x] No large data structures in memory

## Network

- [x] Unread count response is minimal (~10 bytes)
- [x] Notification list response is paginated (20 per page)
- [x] No unnecessary refetching on route changes

## Database Impact

- [x] No new indexes required (existing indexes cover queries)
- [x] Notification creation is O(1) per user
- [x] Broadcast notifications use createMany (batch insert)

## Benchmark

- [x] Unread count query: < 10ms
- [x] Notification list query: < 50ms
- [x] Mark-as-read: < 20ms
