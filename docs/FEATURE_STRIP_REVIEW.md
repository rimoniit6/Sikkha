# Feature Strip Scannability Review

> **Scope:** Evaluate feature strip rendering across 6 breakpoints
> **Method:** Layout analysis of current flex-wrap implementation
> **Breakpoints tested:** 320px, 375px, 390px, 430px, Tablet (768px), Desktop (1440px)

---

## Current Implementation

```jsx
<p className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/70 flex flex-wrap justify-center gap-x-3 gap-y-1 mb-6 sm:mb-8`}>
  <span>🎬 ভিডিও ক্লাস</span>
  <span>📝 MCQ</span>
  <span>📖 বোর্ড প্রশ্ন</span>
  <span>✍️ সৃজনশীল</span>
  <span>🏆 মডেল টেস্ট</span>
  <span>📄 PDF নোট</span>
</p>
```

**Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
**Text size:** `text-xs` (12px) on mobile, `text-sm` (14px) on desktop
**Gap:** `gap-x-3` (12px horizontal), `gap-y-1` (4px vertical)

---

## Item Width Estimation (at text-xs, 12px)

| Item | Characters | Est. Width (with emoji) |
|------|-----------|------------------------|
| 🎥 ভিডিও ক্লাস | 12 | ~100px |
| 📝 MCQ | 5 | ~60px |
| 📖 বোর্ড প্রশ্ন | 11 | ~95px |
| ✍️ সৃজনশীল | 8 | ~75px |
| 🏆 মডেল টেস্ট | 10 | ~90px |
| 📄 PDF নোট | 8 | ~75px |

**Total content width (all 6 items + 5 gaps):** ~530px

---

## Breakpoint Analysis

### 320px (e.g., iPhone SE, older Android)
- Container: 320 - 32 (px-4) = **288px**
- Items per row: 3 (MCQ + সৃজনশীল + PDF নোট = ~210px, fits)
- Row 1: 📝 MCQ · ✍️ সৃজনশীল · 📄 PDF নোট
- Row 2: 🎥 ভিডিও ক্লাস · 📖 বোর্ড প্রশ্ন · 🏆 মডেল টেস্ট
- **Verdict: 2 rows, 3+3 split. Acceptable but not ideal.**

### 375px (e.g., iPhone 12/13/14)
- Container: 375 - 32 = **343px**
- Items per row: 3-4 depending on which items
- Row 1: 📝 MCQ · ✍️ সৃজনশীল · 📄 PDF নোট (210px) + maybe 🏆 মডেল টেস্ট (90px) = 300px + gaps
- Possible: 4 items on row 1, 2 on row 2
- **Verdict: 4+2 split. Orphaned items on row 2.**

### 390px (e.g., iPhone 14 Pro)
- Container: 390 - 32 = **358px**
- Similar to 375px — 4 items may fit on row 1
- **Verdict: 4+2 split. Orphaned items.**

### 430px (e.g., iPhone 14 Pro Max, larger Android)
- Container: 430 - 32 = **398px**
- Row 1: 📝 MCQ + 📖 বোর্ড প্রশ্ন + ✍️ সৃজনশীল + 🏆 মডেল টেস্ট = ~320px + gaps
- Row 2: 🎥 ভিডিও ক্লাস + 📄 PDF নোট
- **Verdict: 4+2 split. Orphaned items.**

### 768px (Tablet)
- Container: 768 - 48 (px-6) = **720px**
- All 6 items fit on 1 row (~530px content + gaps)
- **Verdict: Single row. Clean.**

### 1440px (Desktop)
- Container: 1440 - 64 (px-8) = **1376px** (capped at max-w-7xl = 1280px)
- All 6 items fit easily on 1 row
- **Verdict: Single row. Clean.**

---

## Problem Identified

**On 320px–430px (all common mobile devices), the flex-wrap layout creates orphaned items on the last row.**

The 3+3 or 4+2 split means:
- Row 1 has 3-4 items (full)
- Row 2 has 2-3 items (orphaned, visually unbalanced)

This breaks the scannability requirement. The visitor's eye expects a grid-like pattern, but the orphaned row creates visual noise.

---

## Recommended Fix

**Replace `flex-wrap` with `flex-nowrap overflow-x-auto` on mobile.** This keeps all 6 items on a single scrollable line, maintaining scannability. On tablet and desktop, items fit naturally on one row.

### Why horizontal scroll over flex-wrap on mobile:
1. **Single-line scanning** — the eye scans left-to-right without breaking
2. **No orphaned items** — every row is full
3. **Familiar mobile pattern** — horizontal scroll strips are standard in mobile UI
4. **Preserves exact same content** — no items removed, no labels changed

### Implementation:
- Mobile: `flex-nowrap overflow-x-auto` (scrollable single line)
- Tablet+: `flex-wrap` (all items fit naturally)
- Hide scrollbar for cleanliness
- Snap to items for tactile feedback

---

*The current flex-wrap implementation works on tablet and desktop but fails on mobile due to orphaned items. A responsive approach (scroll on mobile, wrap on desktop) solves this while preserving all 6 features.*
