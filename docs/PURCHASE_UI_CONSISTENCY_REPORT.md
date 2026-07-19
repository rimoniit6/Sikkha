# Purchase UI Consistency Report

> **Date:** 2026-07-18
> **Scope:** Visual consistency of purchase state across all purchasable UI

---

## Standard Purchase State UI

| State | Badge | Badge Color | Button | Button Color |
|-------|-------|-------------|--------|-------------|
| NOT_PURCHASED | 🔒 প্রিমিয়াম | Amber | কিনুন | Outline |
| PENDING_APPROVAL | ⏳ অপেক্ষমাণ | Yellow | যাচাই চলছে | Disabled |
| APPROVED | ✅ কেনা | Emerald | পড়া শুরু করুন / দেখুন | Filled |
| REJECTED | ❌ বাতিল | Rose | আবার পেমেন্ট করুন | Outline |

---

## Components Updated

| Component | File | Change |
|-----------|------|--------|
| PremiumBadge | `PremiumBadge.tsx` | Added `rejected` status with rose badge |
| PremiumLock | `PremiumLock.tsx` | Added `rejected` prop with repurchase UI |
| LectureCard | `chapter-hub/cards/LectureCard.tsx` | Replaced custom badge with PremiumBadge, Bengali text, 4 states |
| SuggestionCard | `chapter-hub/cards/SuggestionCard.tsx` | Replaced custom badge with PremiumBadge, Bengali text, 4 states |
| ExamCard | `chapter-hub/cards/ExamCard.tsx` | Replaced custom badge with PremiumBadge, Bengali text, 4 states |
| PurchaseOptionsModal | `PurchaseOptionsModal.tsx` | Added `rejected` to state type, shows purchase options for repurchase |

---

## Screens Verified

### Homepage

| Element | Purchase State Displayed | Status |
|---------|------------------------|--------|
| Hero | No purchase state (informational) | ✅ N/A |
| Feature Strip | No purchase state | ✅ N/A |
| PremiumBanner | No individual purchase state | ✅ N/A |
| FeaturedCourses | No purchase state on cards | ✅ N/A |

### Content Viewer Pages

| Page | NOT_PURCHASED | PENDING | APPROVED | REJECTED | Status |
|------|--------------|---------|----------|----------|--------|
| Lecture Viewer | PremiumLock (locked) | PremiumLock (pending) | PremiumLock (purchased) | PremiumLock (rejected) | ✅ PASS |
| CQ Viewer | PremiumLock (locked) | PremiumLock (pending) | PremiumLock (purchased) | PremiumLock (rejected) | ✅ PASS |
| Suggestion Detail | PremiumLock (locked) | PremiumLock (pending) | PremiumLock (purchased) | PremiumLock (rejected) | ✅ PASS |

### Content List Pages

| Page | NOT_PURCHASED | PENDING | APPROVED | REJECTED | Status |
|------|--------------|---------|----------|----------|--------|
| Lecture List | "প্রিমিয়াম লেকচার" section | "অপেক্ষমাণ" badge | "কেনা প্রিমিয়াম" section | Maps to locked (repurchase possible) | ⚠️ ACCEPTABLE |
| CQ List | "প্রিমিয়াম সৃজনশীল" section | "অপেক্ষমাণ" badge | "কেনা প্রিমিয়াম" section | Maps to locked (repurchase possible) | ⚠️ ACCEPTABLE |
| Suggestions | "প্রিমিয়াম সাজেশন" section | "অপেক্ষমাণ" section | "কেনা প্রিমিয়াম" section | Maps to locked (repurchase possible) | ⚠️ ACCEPTABLE |

### Chapter Hub Cards

| Card | NOT_PURCHASED | PENDING | APPROVED | REJECTED | Status |
|------|--------------|---------|----------|----------|--------|
| LectureCard | PremiumBadge "প্রিমিয়াম" + "কিনুন" | PremiumBadge "অপেক্ষমাণ" + "যাচাই চলছে" | PremiumBadge "কেনা" + "পড়া শুরু করুন" | PremiumBadge "বাতিল" + "আবার পেমেন্ট করুন" | ✅ PASS |
| SuggestionCard | PremiumBadge "প্রিমিয়াম" + "কিনুন" | PremiumBadge "অপেক্ষমাণ" + "যাচাই চলছে" | PremiumBadge "কেনা" + "দেখুন" | PremiumBadge "বাতিল" + "আবার পেমেন্ট করুন" | ✅ PASS |
| ExamCard | PremiumBadge "প্রিমিয়াম" + "কিনুন" | PremiumBadge "অপেক্ষমাণ" + "যাচাই চলছে" | PremiumBadge "কেনা" + "শুরু করুন" | PremiumBadge "বাতিল" + "আবার পেমেন্ট করুন" | ✅ PASS |
| McqCard | Custom "Premium" badge + lock overlay | Maps to locked | Interactive MCQ | Maps to locked | ⚠️ ACCEPTABLE |
| CqCard | Custom lock overlay | Maps to locked | Interactive CQ | Maps to locked | ⚠️ ACCEPTABLE |
| KnowledgeCard | Custom lock overlay | Maps to locked | Interactive answer | Maps to locked | ⚠️ ACCEPTABLE |
| BoardQuestionCard | Custom lock overlay | Maps to locked | Interactive question | Maps to locked | ⚠️ ACCEPTABLE |

### Board V2 Cards

| Card | NOT_PURCHASED | PENDING | APPROVED | REJECTED | Status |
|------|--------------|---------|----------|----------|--------|
| McqCard | "প্রিমিয়াম" badge + lock | "Pending" text | Interactive MCQ | Maps to locked | ⚠️ ACCEPTABLE |
| CqCard | "প্রিমিয়াম" badge + lock | "Pending" text | Interactive CQ | Maps to locked | ⚠️ ACCEPTABLE |
| QuestionDetailPanel | Lock overlay | "Pending" text | Full access | Maps to locked | ⚠️ ACCEPTABLE |
| PremiumLockOverlay | Lock overlay | N/A | N/A | N/A | ✅ N/A (always locked) |

### Premium/Purchase Pages

| Page | NOT_PURCHASED | PENDING | APPROVED | REJECTED | Status |
|------|--------------|---------|----------|----------|--------|
| Premium Page | Buy button | Pending button | Purchased button | Buy button (repurchase) | ⚠️ ACCEPTABLE |
| Purchase Options Modal | Shows purchase options | Shows pending message | Shows "already purchased" | Shows purchase options (repurchase) | ✅ PASS |
| Payment Page | Shows form | Shows submitting | Shows success | N/A (redirects) | ✅ N/A |

### Dashboard

| Page | Display | Status |
|------|---------|--------|
| Payment History | Shows APPROVED/PENDING/REJECTED badges | ✅ PASS |
| My Purchases | Shows purchased items | ✅ PASS |

---

## Remaining Inconsistencies

| Issue | Severity | Location | Notes |
|-------|----------|----------|-------|
| McqCard uses custom "Premium" badge | LOW | `chapter-hub/cards/McqCard.tsx` | Uses gradient amber badge with Crown icon — visually distinct from PremiumBadge |
| CqCard uses custom lock overlay | LOW | `chapter-hub/cards/CqCard.tsx` | Uses Crown icon overlay — functionally correct but visually different |
| KnowledgeCard uses custom lock overlay | LOW | `chapter-hub/cards/KnowledgeCard.tsx` | Same pattern as CqCard |
| BoardQuestionCard uses custom lock overlay | LOW | `chapter-hub/cards/BoardQuestionCard.tsx` | Same pattern as CqCard |
| Board V2 cards don't show explicit "বাতিল" | LOW | `board/v2/cards/*.tsx` | Rejected maps to locked — allows repurchase |
| List pages don't show "বাতিল" section | LOW | `LectureListPage.tsx`, `CQListPage.tsx` | Rejected items go to locked section |

---

## Remaining Legacy Logic

| Location | Pattern | Why Not Updated |
|----------|---------|-----------------|
| McqCard custom badge | `Crown` + "Premium" | Interactive MCQ card — lock overlay is integral to the card design |
| CqCard custom overlay | `Crown` + "Unlock Now" | Interactive CQ card — lock overlay is integral to the card design |
| KnowledgeCard custom overlay | `Crown` + "Unlock Now" | Same pattern as CQ |
| BoardQuestionCard custom overlay | `Crown` + "Unlock Now" | Same pattern as CQ |
| Board V2 `PurchaseStatusType` | 4 states (no rejected) | Would require updating type + all consumers |

---

## Final UX Score

| Category | Score | Notes |
|----------|-------|-------|
| Core components (PremiumBadge, PremiumLock) | 10/10 | All 4 states handled correctly |
| Viewer pages (Lecture, CQ, Suggestion) | 10/10 | All pass rejected to PremiumLock |
| Chapter hub cards (Lecture, Suggestion, Exam) | 10/10 | Updated with PremiumBadge + Bengali text |
| Chapter hub cards (MCQ, CQ, Knowledge, Board) | 7/10 | Custom lock overlays — functional but visually different |
| Board V2 cards | 7/10 | Custom PurchaseStatusType — no rejected state |
| List pages | 8/10 | Rejected maps to locked — functionally correct |
| Premium/Purchase pages | 9/10 | Modal handles rejected correctly |
| Dashboard | 10/10 | Payment history shows all statuses |

**Overall UX Score: 89/100**

---

## Production Ready Status

**CONDITIONAL PASS.**

The core purchase state UI is consistent:
- PremiumBadge and PremiumLock handle all 4 states correctly
- All viewer pages pass rejected to PremiumLock
- All updated chapter hub cards use PremiumBadge with Bengali text
- The API returns all 4 states

**Remaining items (acceptable):**
- Chapter hub MCQ/CQ/Knowledge/Board cards use custom lock overlays (functionally correct, visually different)
- Board V2 cards don't show explicit "বাতিল" (rejected maps to locked — allows repurchase)
- List pages don't show "বাতিল" section (rejected items go to locked section)

These are visual inconsistencies, not functional issues. The user can always repurchase after rejection.

---

*UX consistency verification complete. Core components and viewer pages are fully consistent. Chapter hub and board cards have acceptable visual variations.*
