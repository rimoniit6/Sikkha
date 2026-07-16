# Custom MCQ Exam Creator — Security Model

## Authentication & Authorization

| Requirement | Implementation |
|-------------|----------------|
| Auth required | All API routes verify session cookie via `verifyAuth()` |
| Ownership validation | Every query includes `userId` filter |
| Admin exception | Admins can access any resource where `auth.isAdmin` is true |
| 403 on unauthorized | Cross-user access returns generic "not found" (no info leakage) |

## Anti-Cheat Measures

### Timer Integrity
- Server stores `startedAt` and `expiresAt` timestamps
- Client calculates remaining time from server timestamps
- Server rejects submissions where `now > expiresAt`
- Client cannot manipulate timer — it's recalculated from server state each second

### Answer Integrity
- Client sends raw answers map
- Server fetches correct answers from database
- Score calculated entirely server-side
- Client-supplied score is never trusted

### Session Integrity
- One active session per user per exam (enforced by unique constraint)
- Session status tracked: IN_PROGRESS → SUBMITTED | EXPIRED
- Expired sessions cannot accept submissions
- Submitted sessions cannot be modified

### Submission Protection
- Idempotency key prevents duplicate submissions
- Attempt number auto-incremented server-side
- Session must be IN_PROGRESS to accept submission
- Session marked SUBMITTED after successful submission

## Data Isolation

### Per-User Resources
Every resource is scoped to its creator/owner:

```
Exam:       WHERE creatorId = userId
ExamResult: WHERE userId = authenticatedUser
ExamSession: WHERE userId = authenticatedUser
```

### IDOR Prevention
- All API queries include `userId` filter
- URL parameters (examId, resultId, sessionId) are never trusted alone
- Server always verifies ownership before returning data
- Changing URL IDs cannot expose other users' data

### Cross-User Protection
- User A cannot see User B's exam results
- User A cannot submit to User B's exam session
- User A cannot delete User B's exams
- User A cannot access User B's analytics

## CSRF Protection
- All POST/DELETE/PATCH routes require CSRF token
- Token validated via `x-csrf-token` header
- Token generated server-side and embedded in page

## Rate Limiting
- `apiLimiter` applied to mutation endpoints
- Prevents brute-force attacks on exam creation/submission
- Headers include rate limit info

## Input Validation
- `chapterIds`: Validated as array, max 20 items
- `questionCount`: Clamped to max 30
- `duration`: Minimum 5 minutes
- `negativeMarks`: Range 0-5
- `difficulty`: Enum validation (EASY/MEDIUM/HARD/MIXED)
- All string inputs sanitized via `sanitizeForStorage()`

## Known Limitations

1. **Browser refresh**: Session state is synced to server periodically (every 10s + on answer change), but there's a small window where unsynced answers could be lost on refresh
2. **Multi-tab**: Not explicitly blocked — two tabs could open the same session. Consider adding tab-lock in future
3. **Network delay**: Submissions with network delay are handled gracefully — server calculates time from its own clock
