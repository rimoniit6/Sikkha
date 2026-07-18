# NoticeBar Animation Review

> **Scope:** Validate `animate-notice-slide-down` after Phase 5 relocation
> **Current position:** Below Hero (HomePage.tsx line 28)
> **Previous position:** Between Header and main (AppShell.tsx line 105)

---

## Root Cause

The `animate-notice-slide-down` animation was designed for the NoticeBar's ORIGINAL position — directly below the navbar. The animation does:

```css
@keyframes notice-slide-down {
  from { max-height: 0; opacity: 0; }
  to { max-height: 3rem; opacity: 1; }
}
```

**Original context:** NoticeBar sits between Header (fixed, 56px) and main content. The animation makes the bar appear to "slide down" from behind the header — as if the header is pushing it into view. This creates a spatial relationship: header → bar → content.

**Current context:** NoticeBar sits below the Hero (after the bottom wave). There is no header above it. The animation still expands from `max-height: 0` to `3rem`, but the "slide-down" metaphor no longer matches — the bar isn't sliding down from anything.

---

## Analysis

| Question | Answer |
|----------|--------|
| Does the animation still work? | **Yes** — `max-height: 0 → 3rem` + `opacity: 0 → 1` creates a smooth reveal |
| Is the animation broken? | **No** — it renders correctly |
| Does the animation mislead? | **Slightly** — the name implies downward movement from the navbar, which no longer applies |
| Does it affect conversion? | **No** — the animation is 0.3s and occurs below the fold |
| Is it a regression from Phase 5? | **Yes** — Phase 5 moved the NoticeBar but didn't update the animation |

---

## Recommended Fix

**Minimal change:** Rename the CSS class from `animate-notice-slide-down` to `notice-reveal`.

This accurately describes what the animation does (reveal the bar by expanding height + fading in) without implying a directional origin (sliding down from the navbar).

The keyframe content stays the same — only the class name changes.

### Files to Modify

| File | Change |
|------|--------|
| `src/app/globals.css` | Rename `.animate-notice-slide-down` to `.notice-reveal` |
| `src/components/shared/NoticeBar.tsx` | Update class reference from `animate-notice-slide-down` to `notice-reveal` |

---

## Is This a Regression from Phase 5?

**Yes.** Phase 5 moved the NoticeBar from AppShell (below navbar) to HomePage (below Hero) but did not update the animation to match the new context. The animation name now implies a spatial relationship that no longer exists.

**Severity:** Low — the animation still functions correctly. The issue is naming accuracy, not behavior.

---

*The animation should be renamed to match its current behavior. The keyframe content is correct — only the class name is misleading.*
