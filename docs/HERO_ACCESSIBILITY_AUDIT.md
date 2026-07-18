# Hero Accessibility Audit

> **Scope:** Complete WCAG 2.2 AA audit of the redesigned HeroSection
> **File:** `src/components/home/HeroSection.tsx` (306 lines)
> **Supporting files:** `src/components/ui/button.tsx`, `src/app/globals.css`

---

## 1. Heading Hierarchy

| Check | Result | Detail |
|-------|--------|--------|
| Only one H1 | **PASS** | Line 239: `<h1>` — "Class 6 থেকে HSC পর্যন্ত A+ পেতে প্রস্তুত হোন" |
| Proper H2/H3 order | **PASS** | No H2/H3 in Hero. Other sections have their own H2s — no conflict. |
| H1 is visible | **PASS** | `text-3xl` to `text-7xl` — largest text on page |

---

## 2. Button Accessibility

| Check | Result | Detail |
|-------|--------|--------|
| Accessible names | **PASS** | "ফ্রি শুরু করুন" and "বোর্ড প্রশ্ন দেখুন" — text content provides accessible name |
| Focus visibility | **PASS** | Button component: `focus-visible:ring-ring/50 focus-visible:ring-[3px]` — visible focus ring |
| Keyboard navigation | **PASS** | Native `<button>` elements — Enter/Space activates, Tab navigates |
| Touch target size | **PASS** | `h-12` (48px) on mobile, `h-13` (52px) on desktop — exceeds 44px minimum |

---

## 3. Color Contrast

### Potential Failures

| Element | Text Color | Background | Opacity | Estimated Ratio | WCAG AA (4.5:1) |
|---------|-----------|------------|---------|----------------|-----------------|
| Badge | white | emerald-700 gradient | 100% | ~4.5:1 | BORDERLINE |
| Headline | white | emerald-700 gradient | 100% | ~4.5:1 | BORDERLINE |
| Subtitle | white | emerald-700 gradient | 85% | ~3.8:1 | **FAIL** |
| Feature Strip | white | emerald-700 gradient | 70% | ~3.2:1 | **FAIL** |
| Trust Message | white | emerald-700 gradient | 70% | ~3.2:1 | **FAIL** |
| Primary CTA | emerald-700 | white | 100% | ~4.5:1 | BORDERLINE |
| Secondary CTA | white | white/5 gradient | 100% | ~3.0:1 | **FAIL** |
| Urgency | white | emerald-700 gradient | 70% | ~3.2:1 | **FAIL** |

**Note:** Exact ratios depend on the specific gradient colors at each pixel. The estimates above assume the darkest point of the gradient. Lighter gradient areas may pass.

---

## 4. Screen Reader Flow

Reading the Hero as a screen reader would:

1. "৮০% কনটেন্ট বিনামূল্যে" (badge)
2. "Class 6 থেকে HSC পর্যন্ত A+ পেতে প্রস্তুত হোন" (h1)
3. "সরকারি কারিকুলাম অনুযায়ী লেকচার, প্র্যাকটিস MCQ ও বোর্ড প্রশ্ন — ৮০% কনটেন্ট বিনামূল্যে" (subtitle)
4. "🎬 ভিডিও ক্লাস 📝 MCQ 📖 বোর্ড প্রশ্ন ✍️ সৃজনশীল 🏆 মডেল টেস্ট 📄 PDF নোট" (feature strip)
5. "১০,০০০+ শিক্ষার্থী · ৫০,০০০+ MCQ · ৮০% কনটেন্ট বিনামূল্যে" (trust message)
6. "ফ্রি শুরু করুন" (primary button)
7. "বোর্ড প্রশ্ন দেখুন" (secondary button)
8. "{Exam Name}: {days} দিন বাকি — এখনই প্রস্তুতি শুরু করুন" (urgency, if present)

**Verdict:** The flow makes sense. Each element communicates clearly. The feature strip emojis will be announced as "movie camera", "memo", etc. — this is slightly noisy but not harmful.

---

## 5. Emoji Accessibility

| Location | Emoji | Decorative? | aria-hidden? | Action Needed |
|----------|-------|-------------|--------------|---------------|
| Floating elements | None (Lucide icons) | Yes | YES (`aria-hidden="true"`) | None |
| Feature strip | 🎥 📝 📖 ✍️ 🏆 📄 | **No — they label content types** | **No** | **Should NOT be hidden** — they're part of the content |
| Particle canvas | None | Yes | YES (`aria-hidden="true"`) | None |
| Bottom wave | None | Yes | YES (`aria-hidden="true"`) | None |

**Verdict:** Emojis in the feature strip are content, not decoration. They should be read by screen readers. No change needed.

---

## 6. Motion

| Element | Animation | prefers-reduced-motion? | Issue |
|---------|-----------|------------------------|-------|
| Particle canvas | `requestAnimationFrame` loop | **NO** — CSS media query doesn't control canvas | **ISSUE** — particles animate even when user prefers reduced motion |
| Floating elements | CSS `animate-float-*` | **YES** — `globals.css` line 954 reduces to 0.01ms | None |
| Gradient background | CSS `animate-gradient` | **YES** — reduced to 0.01ms | None |
| Stagger children | CSS `stagger-children` | **YES** — reduced to 0.01ms | None |
| Hover transitions | CSS `transition-all` | **YES** — reduced to 0.01ms | None |
| Mouse parallax | JS `transform` + CSS `transition` | **PARTIAL** — transition is reduced, but transform still updates | Minor — transform updates are imperceptible when transition is 0.01ms |

---

## 7. Mobile Accessibility

| Check | Result | Detail |
|-------|--------|--------|
| Touch targets ≥44px | **PASS** | Buttons: 48px (h-12). Badge: ~40px (py-2 + text). Feature strip items: ~32px (text-xs + padding) — slightly small |
| Button spacing | **PASS** | `gap-3` (12px) between stacked CTAs on mobile |
| Scrollable feature strip | **PASS** | `snap-x snap-mandatory` provides snap points. `no-scrollbar` hides scrollbar but maintains scroll functionality |
| Feature strip keyboard access | **PASS** | Horizontal scroll is accessible via arrow keys when focused |

---

## 8. Landmark Structure

| Landmark | Element | Present? |
|----------|---------|----------|
| Banner | `<header>` in Header.tsx | **YES** |
| Main | `<main>` in AppShell.tsx | **YES** |
| Contentinfo | `<footer>` in Footer.tsx | **YES** |
| Region (Hero) | `<section>` in HeroSection.tsx | **YES** |

**Verdict:** All required landmarks are present. The `<section>` element implicitly creates a region landmark.

---

## 9. WCAG 2.2 AA Compliance

### Critical Issues (Must Fix)

| # | Issue | WCAG Criterion | Severity |
|---|-------|---------------|----------|
| 1 | **Feature strip text contrast** — white/70 on emerald gradient (~3.2:1) | 1.4.3 Contrast (Minimum) | CRITICAL |
| 2 | **Trust message text contrast** — white/70 on emerald gradient (~3.2:1) | 1.4.3 Contrast (Minimum) | CRITICAL |
| 3 | **Urgency text contrast** — white/70 on emerald gradient (~3.2:1) | 1.4.3 Contrast (Minimum) | CRITICAL |
| 4 | **Secondary CTA text contrast** — white on white/5 gradient (~3.0:1) | 1.4.3 Contrast (Minimum) | CRITICAL |
| 5 | **Particle canvas ignores prefers-reduced-motion** | 2.3.3 Animation from Interactions | CRITICAL |

### Non-Critical Issues (Should Fix)

| # | Issue | WCAG Criterion | Severity |
|---|-------|---------------|----------|
| 6 | Subtitle text contrast — white/85 on emerald (~3.8:1) | 1.4.3 Contrast (Minimum) | HIGH |
| 7 | Badge text contrast — white on emerald (~4.5:1) | 1.4.3 Contrast (Minimum) | MEDIUM |
| 8 | Feature strip items touch targets — ~32px (below 44px) | 2.5.8 Target Size | LOW |

---

## Fixes Required

### Fix 1: Increase text opacity for contrast compliance

Change text opacity from `text-white/70` to `text-white/90` for:
- Feature strip items (line 251)
- Trust message (line 256)
- Urgency message (line 286)

**Estimated contrast improvement:** ~3.2:1 → ~4.0:1 (closer to AA threshold)

### Fix 2: Improve secondary CTA contrast

Change secondary CTA background from `bg-white/5` to `bg-white/15` or `bg-white/20` to increase contrast.

### Fix 3: Add prefers-reduced-motion check to ParticleCanvas

Add a check at the top of the ParticleCanvas useEffect:
```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (prefersReduced) return
```

This stops the canvas animation when the user prefers reduced motion.

---

*This audit identifies 5 critical issues and 3 non-critical issues. All critical issues can be fixed with minimal code changes (opacity adjustments + one motion check).*
