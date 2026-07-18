# Hero Technical Debt Review

> **Scope:** Identify future extraction opportunities in HeroSection.tsx
> **Constraint:** NO code changes. NO refactoring. NO new files. Analysis only.
> **File under review:** `src/components/home/HeroSection.tsx` (340 lines)

---

## 1. Has HeroSection become responsible for business logic?

**Yes.** The urgency calculation (lines 166–202) is business logic embedded in a UI component:

- Reads config data (exam dates, names)
- Maps class levels to exam types
- Calculates days remaining
- Applies priority rules (class-based → nearest → hide)
- Stores result in component state

This logic has nothing to do with rendering. It's a decision engine that determines WHAT to show, not HOW to show it.

**Additionally:**
- `formatStatValue` (line 21) is a utility function in the component
- `heroStats` computation (lines 157–164) transforms raw data into display format
- Feature strip items (line 260) are hardcoded content data

---

## 2. Which logic belongs in the component?

| Logic | Belongs in Component? | Reason |
|-------|----------------------|--------|
| JSX rendering (badge, headline, CTAs) | YES | This is the component's job |
| Responsive class selection (`isMobile ? ... : ...`) | YES | Viewport-specific styling is UI concern |
| Button click handlers (`navigate(...)`) | YES | User interaction handling |
| Conditional rendering (`urgency && ...`) | YES | Display logic |
| CSS class composition | YES | Presentation concern |

---

## 3. Which logic should eventually move out?

### To Utility (`src/lib/`)

| Logic | Current Location | Target | Reason |
|-------|-----------------|--------|--------|
| `formatStatValue(count)` | Line 21 (inline) | `src/lib/format.ts` or similar | Pure function, no React dependency. Used by Hero and potentially EnhancedStats, AchievementBadges. |

### To Hook (`src/hooks/`)

| Logic | Current Location | Target | Reason |
|-------|-----------------|--------|--------|
| Urgency calculation | Lines 166–202 (inline useEffect) | `src/hooks/use-exam-urgency.ts` | Business logic with reusable potential. Multiple components need this. |
| `useIsMobile()` | Lines 26–35 (inline) | `src/hooks/use-is-mobile.ts` | Generic responsive hook. Used by Hero, potentially by any mobile-aware component. |
| Mouse parallax | Lines 145–155 (inline useEffect) | `src/hooks/use-mouse-parallax.ts` | Generic interaction hook. Could be reused by any parallax-enabled component. |
| Feature strip data | Line 260 (hardcoded array) | `src/constants/hero.ts` or config | Content data should be configurable, not hardcoded. |

### To Component (`src/components/`)

| Logic | Current Location | Target | Reason |
|-------|-----------------|--------|--------|
| `ParticleCanvas` | Lines 38–136 (inline) | `src/components/ui/particle-canvas.tsx` | Self-contained visual component. 100 lines of canvas logic doesn't belong in Hero. |

### To Config (SiteConfig / admin panel)

| Logic | Current Location | Target | Reason |
|-------|-----------------|--------|--------|
| Feature strip items | Line 260 (hardcoded) | `config.heroFeatures` | Admin should be able to change featured content types without code deployment |
| Trust message text | Line 267 (hardcoded) | `config.heroTrustMessage` | Admin should be able to update trust signals |
| CTA labels | Lines 278, 289 (hardcoded) | `config.heroPrimaryCta`, `config.heroSecondaryCta` | Admin should be able to test different CTA copy |

---

## 4. Is the urgency calculation reusable?

**Yes — highly reusable.** The logic is:

1. Read exam dates from config
2. Calculate days remaining
3. Filter to valid exams (0 < days < 180)
4. Select by priority (class-based → nearest → none)

This exact logic would be needed by:

| Component | Use Case |
|-----------|----------|
| **Header** | Show exam countdown badge in navigation |
| **Dashboard** | Show "Your next exam: SSC in 90 days" personal greeting |
| **ExamCountdownSection** | Already has similar logic — could share the same hook |
| **NoticeBar** | Show exam-related announcements with countdown context |
| **Exam pages** | Show "Exam in X days — start practicing" |
| **Mobile bottom nav** | Show urgency indicator dot |
| **Push notifications** | "SSC exam in 30 days — time to prepare" |

**The urgency hook would replace duplicated logic in ExamCountdownSection and provide urgency data to 6+ other components.**

---

## 5. Could another component need the same urgency logic later?

**Almost certainly yes.** The current `ExamCountdownSection` already has its own exam date logic (reading from the same config fields). If both the Hero and ExamCountdownSection independently calculate exam urgency, they risk:

- **Inconsistency:** One shows "180 days" while the other shows "179 days" (timing difference)
- **Duplication:** Same 30 lines of logic in two places
- **Maintenance burden:** When exam config changes, both must be updated

A shared `useExamUrgency()` hook eliminates all three risks.

---

## 6. Ideal Future Architecture

### Extracted Hook: `useExamUrgency()`

```
src/hooks/use-exam-urgency.ts

Input: config (from useSiteConfig), classLevel (from useLearningPreference)
Output: { name: string | null, days: number | null, isUrgent: boolean }

Logic:
  1. Read exam dates from config
  2. Calculate days remaining for each
  3. Filter to valid (0 < days < 180)
  4. Priority 1: class-based match
  5. Priority 2: nearest exam
  6. Priority 3: null (no urgency)
```

### Extracted Hook: `useIsMobile()`

```
src/hooks/use-is-mobile.ts

Input: none
Output: boolean

Logic:
  1. Read window.innerWidth
  2. Listen to resize events
  3. Return true if < 768px
```

### Extracted Utility: `formatStatValue()`

```
src/lib/format.ts

Input: count: number
Output: string (Bengali formatted with + suffix)

Logic:
  1. If 0, return '০'
  2. Format with Intl.NumberFormat('bn-BD')
  3. Append '+'
```

### Extracted Component: `ParticleCanvas`

```
src/components/ui/particle-canvas.tsx

Input: isMobile: boolean
Output: <canvas> element with animation

Logic: Self-contained canvas particle system (100 lines)
```

### Configurable Content

```
config.heroFeatures: string[]     → feature strip items
config.heroTrustMessage: string   → trust message text
config.heroPrimaryCta: string     → primary CTA label
config.heroSecondaryCta: string   → secondary CTA label
```

---

## Summary: Extraction Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | `useExamUrgency()` hook | Low | Eliminates duplication with ExamCountdownSection |
| 2 | `useIsMobile()` hook | Low | Reusable across components |
| 3 | `formatStatValue()` utility | Trivial | Clean separation of concerns |
| 4 | `ParticleCanvas` component | Medium | 100 lines out of Hero |
| 5 | Configurable content fields | Medium | Admin can update without code |

**None of these changes are urgent.** The current HeroSection works correctly. These are future extraction opportunities to be addressed when:
- Another component needs urgency logic (extract hook)
- The Hero grows beyond 400 lines (extract ParticleCanvas)
- Admin requests content changes without deployment (add config fields)

---

*This document identifies technical debt only. No code changes recommended at this time.*
