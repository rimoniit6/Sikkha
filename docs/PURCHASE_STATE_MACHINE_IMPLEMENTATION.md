# Purchase State Machine — Implementation Plan

> **Scope:** Unified purchase state system for the entire platform
> **Date:** 2026-07-18
> **Status:** Core resolver implemented. API and UI updates pending.

---

## State Diagram

```
                    ┌─────────────────┐
                    │  NOT_PURCHASED  │
                    └────────┬────────┘
                             │ User submits payment
                             ▼
                    ┌─────────────────┐
                    │ PENDING_APPROVAL│
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
       ┌──────────────┐         ┌──────────────┐
       │   APPROVED   │         │   REJECTED   │
       └──────────────┘         └──────┬───────┘
                │                       │
                │                       │ User submits new payment
                │                       ▼
                │              ┌─────────────────┐
                │              │ PENDING_APPROVAL│
                │              └─────────────────┘
                │
                ▼
         ┌──────────┐
         │   END    │
         └──────────┘
```

### Allowed Transitions

| From | To | Trigger |
|------|-----|---------|
| NOT_PURCHASED | PENDING_APPROVAL | User submits payment |
| PENDING_APPROVAL | APPROVED | Admin approves payment |
| PENDING_APPROVAL | REJECTED | Admin rejects payment |
| REJECTED | PENDING_APPROVAL | User submits new payment |
| APPROVED | END | Terminal state |

### Forbidden Transitions

| From | To | Reason |
|------|-----|--------|
| PENDING_APPROVAL | PENDING_APPROVAL | Duplicate payment prevented |
| APPROVED | PENDING_APPROVED | Already owns content |
| APPROVED | APPROVED | Already owns content |

---

## Files Modified

| File | Status | Change |
|------|--------|--------|
| `src/lib/purchase-state.ts` | ✅ NEW | Centralized resolver (520 lines) |
| `src/app/api/payment/check/route.ts` | ⏳ PENDING | Refactor to use resolver |
| `src/app/api/payment/access/route.ts` | ⏳ PENDING | Refactor to use resolver |
| `src/app/api/payment/batch-check/route.ts` | ⏳ PENDING | Refactor to use resolver |
| `src/components/shared/PremiumLock.tsx` | ⏳ PENDING | Add REJECTED state |
| `src/components/shared/PremiumBadge.tsx` | ⏳ PENDING | Add REJECTED badge |
| `src/components/shared/PurchaseOptionsModal.tsx` | ⏳ PENDING | Use new state enum |
| `src/components/payment/PaymentPage.tsx` | ⏳ PENDING | Check state before allowing payment |
| `src/app/api/payment/route.ts` | ⏳ PENDING | Prevent duplicate PENDING payments |

---

## APIs Affected

### Existing APIs (to be refactored)

| API | Current Response | New Response |
|-----|-----------------|--------------|
| `GET /api/payment/check` | `{ purchased, pendingPayment, reason }` | `{ state, reason, paymentId, hasAccess }` |
| `GET /api/payment/access` | `{ hasAccess, purchase, isPremium }` | `{ state, reason, paymentId, hasAccess }` |
| `GET /api/payment/batch-check` | `{ items: [{ contentType, contentId, purchased, pendingPayment }] }` | `{ items: [{ contentType, contentId, state, hasAccess }] }` |
| `POST /api/payment` | Creates PENDING payment | Add duplicate PENDING check |

### New APIs (optional)

| API | Purpose |
|-----|---------|
| `GET /api/purchase-status` | Unified endpoint using resolver (alternative to /check) |

---

## Components Affected

### PremiumLock.tsx

**Current states:** purchased, pendingPayment, default (locked)

**New states:**
| State | Badge | Button | Access |
|-------|-------|--------|--------|
| NOT_PURCHASED | "কিনুন" (Buy) | Enabled → opens modal | No |
| PENDING_APPROVAL | "⏳ অপেক্ষমাণ" (Pending) | Disabled → "যাচাই চলছে" | No |
| APPROVED | "✅ কেনা হয়েছে" (Purchased) | Hidden or "পড়া শুরু করুন" | Yes |
| REJECTED | "❌ বাতিল" (Rejected) | Enabled → opens modal | No |

### PremiumBadge.tsx

**Current statuses:** free, purchased, locked, pending

**New statuses:**
| Status | Badge Text | Icon | Color |
|--------|-----------|------|-------|
| free | "ফ্রি" | Eye | Green |
| purchased | "✅ কেনা হয়েছে" | CheckCircle2 | Emerald |
| pending | "⏳ অপেক্ষমাণ" | Clock | Yellow |
| rejected | "❌ বাতিল" | XCircle | Red |
| locked | "প্রিমিয়াম" | Lock | Amber |

### PurchaseOptionsModal.tsx

**Current states:** checking, available, pending, purchased

**New states:** checking, available, pending, purchased, rejected

---

## Database Impact

**No schema changes required.** The existing `Payment` model already stores:
- `status`: PENDING | APPROVED | REJECTED
- `userId`, `contentType`, `contentId`
- `createdAt`, `updatedAt`

The resolver reads from existing tables:
- `Payment` (direct payments)
- `UserSubscription` (subscriptions)
- `BundleItem` → `Payment` (bundle access)
- `MCQExamPackagePurchase` (exam packages)
- `CQExamPackagePurchase` (exam packages)
- `CoursePurchase` → `CourseEnrollment` (course access)

---

## Access Control Flow

```
User requests content
  → Frontend calls GET /api/payment/check
    → Resolver checks (in priority order):
      1. Active subscription → APPROVED → grant access
      2. Approved direct payment → APPROVED → grant access
      3. Approved bundle payment → APPROVED → grant access
      4. Approved exam package → APPROVED → grant access
      5. Approved course purchase → APPROVED → grant access
      6. Pending payment → PENDING_APPROVAL → deny access
      7. Rejected payment → REJECTED → deny access
      8. No payments → NOT_PURCHASED → deny access
  → Frontend renders appropriate UI based on state
```

---

## UI Behavior

### Homepage

| Content | State | Display |
|---------|-------|---------|
| Free content | NOT_PURCHASED | No badge, full access |
| Premium content (no payment) | NOT_PURCHASED | "কিনুন" badge, locked overlay |
| Premium content (pending) | PENDING_APPROVAL | "⏳ অপেক্ষমাণ" badge, pending overlay |
| Premium content (approved) | APPROVED | "✅ কেনা হয়েছে" badge, full access |
| Premium content (rejected) | REJECTED | "❌ বাতিল" badge, locked overlay, re-purchase enabled |

### Content Cards

| State | Badge | Action |
|-------|-------|--------|
| NOT_PURCHASED | "কিনুন" | Click → PurchaseOptionsModal |
| PENDING_APPROVAL | "⏳ অপেক্ষমাণ" | Click → "যাচাই চলছে" message |
| APPROVED | "✅ কেনা হয়েছে" | Click → navigate to content |
| REJECTED | "❌ বাতিল" | Click → PurchaseOptionsModal |

### Dashboard

| Section | State | Display |
|---------|-------|---------|
| My Purchases | APPROVED | Listed with "কেনা" badge |
| Pending Payments | PENDING_APPROVAL | Listed with "অপেক্ষমাণ" badge |
| Rejected Payments | REJECTED | Listed with "বাতিল" badge, retry option |

---

## Admin Behavior

### Admin Approves Payment

```
Admin clicks "Approve"
  → PATCH /api/admin/payments { id, status: 'approved' }
    → Payment.status = 'APPROVED'
    → Side effects (enrollment, subscription, etc.)
    → Notification to user
    → Audit log
  → User's next /api/payment/check returns state: 'APPROVED'
  → UI updates: "⏳ অপেক্ষমাণ" → "✅ কেনা হয়েছে"
```

### Admin Rejects Payment

```
Admin clicks "Reject" + enters reason
  → PATCH /api/admin/payments { id, status: 'rejected', adminNote: '...' }
    → Payment.status = 'REJECTED'
    → Notification to user
    → Audit log
  → User's next /api/payment/check returns state: 'REJECTED'
  → UI updates: "⏳ অপেক্ষমাণ" → "❌ বাতিল"
  → Purchase button re-enabled
```

---

## Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| **Duplicate payment** | POST /api/payment checks for existing PENDING payment → returns `PENDING_PAYMENT` error |
| **Double click** | Button disabled during submission (`paymentStatus === 'submitting'`) |
| **Two browser tabs** | Both tabs show same state from API. Second tab's submission blocked by duplicate check. |
| **Refreshing during payment** | State persists in DB. Page reload shows correct state from API. |
| **Network retry** | Idempotency key prevents duplicate records. Same request returns existing payment. |
| **Expired payment** | No expiration in current system. Payments stay PENDING until admin action. |
| **Race conditions** | Prisma unique constraints + P2002 error handling prevent concurrent duplicates. |
| **Bundle contains rejected item** | Bundle access requires ALL items approved. Rejected item blocks bundle access. |
| **Subscription expires** | `endDate < now()` → subscription check fails → falls through to payment check. |
| **Admin self-approval** | Blocked by `existing.userId === auth.user.id` check in admin route. |

---

## Future Scalability

### Adding New Content Types

To add a new purchasable content type:

1. Add `isPremium` and `price` fields to the Prisma model
2. Add the content type to `getValidContentTypes()` in `src/lib/content-type-labels.ts`
3. The resolver automatically handles it via the generic payment check layers
4. No changes needed to the resolver itself

### Adding New Access Layers

To add a new access mechanism (e.g., referral rewards):

1. Add a new layer in `resolvePurchaseStatus()` (e.g., Layer 5.5)
2. The resolver returns `APPROVED` with the new reason
3. All consumers automatically use the new layer

### Content-Specific Logic

The resolver intentionally avoids content-specific logic. All access is determined by:
- Payment records (direct, bundle, package)
- Subscription records
- Exam package purchase records
- Course purchase records

No content type has special handling beyond cross-type matching (mcq ↔ board-mcq, cq ↔ board-cq).

---

## Resolver Implementation

### File: `src/lib/purchase-state.ts`

**Status:** ✅ IMPLEMENTED (520 lines)

**Exports:**
- `PurchaseState` type — `'NOT_PURCHASED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'`
- `PurchaseStatus` interface — `{ state, reason, paymentId, hasAccess, ... }`
- `resolvePurchaseStatus(userId, contentType, contentId)` — main resolver
- `resolveBatchPurchaseStatuses(userId, items)` — batch resolver

**Priority order:**
1. Active subscription → APPROVED
2. Approved direct payment → APPROVED
3. Approved bundle payment → APPROVED
4. Bundle reverse-check → APPROVED
5. Package subscription → APPROVED
6. Exam package purchase → APPROVED
7. Pending payment → PENDING_APPROVAL
8. Rejected payment → REJECTED
9. Default → NOT_PURCHASED

---

## Implementation Status

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1: Resolver | ✅ DONE | `src/lib/purchase-state.ts` created |
| Phase 2: API refactoring | ⏳ PENDING | Update /check, /access, /batch-check routes |
| Phase 3: UI components | ⏳ PENDING | Update PremiumLock, PremiumBadge, PurchaseOptionsModal |
| Phase 4: Duplicate prevention | ⏳ PENDING | Add PENDING duplicate check to POST /api/payment |
| Phase 5: Testing | ⏳ PENDING | Verify all states across all content types |

---

*This document describes the complete Purchase State Machine architecture. The core resolver is implemented. API and UI updates are pending.*
