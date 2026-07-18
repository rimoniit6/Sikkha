# NoticeBar Placement Review

> **Scope:** Validate NoticeBar position in the homepage information hierarchy
> **Current position:** Between Header and Hero (AppShell.tsx, line 105)
> **Proposed position:** Below Hero (HomePage.tsx, after HeroSection)

---

## Question 1: Does the NoticeBar interrupt the Hero's conversion flow?

**Yes.**

The NoticeBar sits directly between the Header and the Hero. It's a 36px tall bar with a green gradient background that shows rotating announcements.

For first-time visitors, the visual sequence is:
```
Header → Green bar (NoticeBar) → Green gradient (Hero)
```

The NoticeBar uses a similar green gradient to the Hero (`from-emerald-600 via-teal-600 to-cyan-600`), creating visual blending. The visitor's eye has to process the NoticeBar before reaching the Hero's headline. This delays comprehension by approximately 0.5–1 second.

**Impact:** The Hero's 3-second comprehension window is reduced by the NoticeBar's visual noise.

---

## Question 2: Is the NoticeBar important enough to appear immediately after the Hero?

**No.**

The NoticeBar shows platform announcements (exam schedules, new features, system updates). These are:
- **Important for returning visitors** — they want to know what's new
- **Not important for first-time visitors** — they need to understand the platform first

The information hierarchy should serve first-time visitors first (conversion), then returning visitors (engagement). Quick Search (which serves high-intent visitors) is more conversion-critical than announcements.

**Recommended order:** Hero → Quick Search → NoticeBar (not Hero → NoticeBar → Quick Search)

---

## Question 3: Could users mistake the NoticeBar as part of the Hero?

**Yes.**

Both the NoticeBar and Hero use green gradient backgrounds:
- NoticeBar: `from-emerald-600 via-teal-600 to-cyan-600`
- Hero: `from-emerald-700 via-teal-600 to-emerald-800`

The colors are similar enough that a visitor scanning quickly may not distinguish them as separate elements. The NoticeBar looks like a subtitle or secondary message within the Hero, not an independent announcement bar.

**This creates confusion:** "Is this part of the platform's value proposition? Or is it an announcement?"

---

## Question 4: Should the NoticeBar have different visual separation?

**Yes — but the minimum fix is relocation, not restyling.**

Moving the NoticeBar below the Hero provides natural visual separation:
- Hero ends with the bottom wave (visual boundary)
- NoticeBar appears after the wave (clear separation)
- The wave acts as a visual "section divider"

No CSS changes needed. The wave SVG already provides sufficient separation.

---

## Question 5: Should it be dismissible?

**Already is.** The NoticeBar has a dismiss button (X icon, line 107–112). When dismissed, `dismissed` state is set to `true` and the component returns `null`.

No change needed.

---

## Question 6: Should it collapse automatically when there are no active notices?

**Already does.** Line 38: `if (dismissed || notices.length === 0) return null`

When there are no notices from the API, the component renders nothing. No empty bar, no wasted space.

No change needed.

---

## Question 7: Should multiple notices rotate or stack?

**Already rotates.** The NoticeBar auto-rotates notices every 5 seconds (line 17–22). Pagination dots allow manual navigation (lines 82–96).

Rotation is the correct behavior — stacking would consume too much vertical space.

No change needed.

---

## Question 8: Is there any duplicate information between the Hero and NoticeBar?

**Minimal overlap.**

| Hero Content | NoticeBar Content | Overlap? |
|-------------|------------------|----------|
| Exam countdown (urgency block) | Exam schedule announcement | Potential — if exam announcement is in NoticeBar and countdown is in Hero |
| Platform announcements | Platform announcements | No — Hero doesn't show announcements |

**If an exam announcement appears in both the NoticeBar and the Hero urgency block**, the visitor sees the same information twice. This is redundant but not harmful — repetition can reinforce urgency.

**Minimum fix:** No change needed. The overlap is acceptable.

---

## Question 9: Does the NoticeBar reduce the visibility of Quick Search?

**Yes.**

Current layout:
```
Header (56px)
NoticeBar (36px)
Hero (min-h-[80vh])
Quick Search (below Hero)
```

The NoticeBar consumes 36px of above-the-fold space. On a 390×844 viewport, this means:
- Hero starts at 92px (56 + 36) instead of 56px
- Quick Search is pushed 36px further down
- The visitor must scroll 36px more to reach Quick Search

**Impact:** Quick Search is already below the fold. The NoticeBar makes it even less accessible.

---

## Question 10: Will this hierarchy still work after the homepage grows?

**Yes — if the NoticeBar is below the Hero.**

The current hierarchy (NoticeBar above Hero) becomes increasingly problematic as the Hero grows:
- More Hero content → taller Hero → NoticeBar pushes everything further down
- More sections below → longer page → NoticeBar is increasingly irrelevant

Moving the NoticeBar below the Hero ensures it doesn't interfere with the Hero regardless of how much content is added.

---

## Issues Found

### Issue 1: NoticeBar interrupts Hero conversion flow
**Fix:** Move NoticeBar below Hero (approved in Phase 5).

### Issue 2: NoticeBar uses sticky positioning that may conflict with Header
**Current:** `sticky top-16 z-40` — sticks below the Header when scrolling
**Problem:** When NoticeBar is below the Hero, sticky positioning is unnecessary and may cause visual issues (NoticeBar sticks while Hero scrolls away)
**Fix:** Remove `sticky top-16 z-40` from NoticeBar when it's in HomePage. Keep sticky behavior only when NoticeBar is in AppShell (non-homepage pages).

### Issue 3: NoticeBar is currently on ALL pages (AppShell), but should be below Hero only on homepage
**Current:** AppShell renders NoticeBar on every page
**Problem:** Moving NoticeBar to HomePage means it only appears on the homepage. Other pages lose the NoticeBar.
**Fix:** Two options:
- **Option A:** Keep NoticeBar in AppShell for non-homepage routes, add to HomePage for homepage. Requires route detection in AppShell.
- **Option B:** Remove NoticeBar from AppShell entirely, add to HomePage only. Other pages lose announcements.
- **Recommended:** Option A — add a simple route check in AppShell to skip NoticeBar on the homepage route.

---

## Minimum Implementation Required

### Change 1: Modify AppShell.tsx
- Add route detection: `const isHome = parsed?.route === 'home'`
- Conditionally render NoticeBar: `{!isAdmin && !isHome && <NoticeBar />}`
- This removes NoticeBar from the homepage but keeps it on all other pages

### Change 2: Modify HomePage.tsx
- Import NoticeBar
- Add `<NoticeBar />` after `<HeroSection />`
- NoticeBar renders below the Hero on the homepage

### Change 3: NoticeBar sticky behavior
- When NoticeBar is in HomePage (below Hero), remove `sticky top-16 z-40`
- Add a prop `sticky` (default true) to NoticeBar
- In AppShell: `<NoticeBar sticky />` (keeps sticky behavior)
- In HomePage: `<NoticeBar sticky={false} />` (no sticky behavior)

**OR** (simpler): Since the NoticeBar is only 36px and rarely has more than 3-4 notices, the sticky behavior is not critical. Remove sticky entirely. The NoticeBar scrolls with the page on all routes. This is simpler and avoids the prop complexity.

---

*The NoticeBar should be moved below the Hero. The minimum implementation is 2 file changes (AppShell.tsx + HomePage.tsx) with optional sticky behavior removal.*
