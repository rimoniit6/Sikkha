# Hero Section Implementation Plan (v3)

> **Scope:** Redesign above-the-fold experience — Header area, HeroSection, NoticeBar placement
> **Source of truth:** All previous docs + ABOVE_THE_FOLD_REVIEW.md
> **Constraint:** No backend changes, no API changes, no DB changes, no breaking changes
> **Review status:** ABOVE_THE_FOLD_REVIEW — 4 FAIL items addressed in this plan

---

## 1. Files to Modify

| File | Change | Reason |
|------|--------|--------|
| `src/components/home/HeroSection.tsx` | Full rewrite — 8 content blocks | Primary target |
| `src/components/layout/AppShell.tsx` | Move `<NoticeBar />` from above main to below Hero | Remove NoticeBar from above-the-fold |
| `src/components/home/HomePage.tsx` | Add `<NoticeBar />` below HeroSection | Receive NoticeBar from AppShell |

**3 files modified. Zero backend, API, or database changes.**

---

## 2. Components Affected

| Component | Impact | Action |
|-----------|--------|--------|
| `src/components/home/HomePage.tsx` | NoticeBar added after HeroSection | Import and render |
| `src/components/layout/AppShell.tsx` | NoticeBar removed from above main | Remove from layout |
| `src/components/ui/button` | Used as-is | Reuse for CTAs |
| `src/hooks/use-metadata.ts` | Used as-is | `useSiteConfig()`, `usePublicStats()` |
| `src/store/router.ts` | Used as-is | `useRouterStore` |
| `src/app/globals.css` | None | Existing animations reused |

---

## 3. Components to Create

**None.** All 3 modified files already exist.

---

## 4. Components to Remove from HeroSection.tsx

| Element | Reason |
|---------|--------|
| `ParticleCanvas` function | Visual noise, CPU/battery drain |
| `floatingElements` array | Visual noise, distracts from headline |
| Mouse parallax effect | Gimmick, distracts from text |
| `mousePos` state | No longer needed |
| Floating icon rendering | Removed with floatingElements |
| ParticleCanvas rendering | Removed with ParticleCanvas |
| Sparkles icon in badge | Replaced by new badge content |
| Gradient text shimmer | Removed for headline readability |
| Pulse ring animations | Removed for reduced noise |
| Stats grid (4 stat cards) | Replaced by trust message line |

---

## 5. What's Kept

| Element | Reason |
|---------|--------|
| `useIsMobile` hook | Responsive CTA layout |
| `usePublicStats` hook | Trust message dynamic data |
| `useSiteConfig` hook | Config overrides |
| `useRouterStore` hook | CTA navigation |
| Bottom wave SVG | Section transition |
| Gradient background (all 4 layers) | Brand identity |
| `animate-gradient` CSS class | Background animation |
| `stagger-children` CSS class | Content animation |
| `Button` component | CTA buttons |
| `formatStatValue` function | Trust message formatting |

---

## 6. New Content Structure (8 blocks)

### Block 1: Trust Badge
```
Content: "৮০% কনটেন্ট বিনামূল্যে"
Purpose: Eliminate cost anxiety before headline
Config override: config?.heroBadge
Fallback: "৮০% কনটেন্ট বিনামূল্যে"
```

### Block 2: Headline
```
Content: "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন"
Purpose: Promise an outcome
Config override: config?.heroTitle
Fallback: "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন"
```

### Block 3: Supporting Sentence
```
Content: "সরকারি কারিকুলাম অনুযায়ী লেকচার, প্র্যাকটিস MCQ ও বোর্ড প্রশ্ন — ৮০% কনটেন্ট বিনামূল্যে"
Purpose: Explain how the headline promise is delivered
Config override: config?.heroSubtitle
Fallback: "সরকারি কারিকুলাম অনুযায়ী লেকচার, প্র্যাকটিস MCQ ও বোর্ড প্রশ্ন — ৮০% কনটেন্ট বিনামূল্যে"
```

### Block 4: Feature Strip [NEW — addresses FAIL #3 and #9]
```
Content: "ভিডিও লেকচার · MCQ প্র্যাকটিস · বোর্ড প্রশ্ন · মডেল টেস্ট"
Purpose: Immediately answer "What can I do here?" — product discovery
Position: Between supporting sentence and trust message
Style: Simple text line with separators (·), no icons, no cards
Why these 4 items:
  - "ভিডিও লেকচার" → addresses YouTube visitor journey
  - "MCQ প্র্যাকটিস" → addresses SSC/HSC visitor journey
  - "বোর্ড প্রশ্ন" → addresses highest-intent visitors
  - "মডেল টেস্ট" → addresses exam preparation visitors
```

### Block 5: Trust Message [MOVED UP — addresses FAIL #4 and #7]
```
Content: "১০,০০০+ শিক্ষার্থী · ৫০,০০০+ MCQ · হাজার হাজার লেকচার · ৮০% ফ্রি"
Purpose: Social proof BEFORE the visitor is asked to click
Position: Between feature strip and primary CTA
Data source: usePublicStats()
Loading state: Show static fallback when stats are 0 or loading
```

### Block 6: Primary CTA
```
Content: "ফ্রি শুরু করুন"
Action: navigate('class-list')
Purpose: Lowest-friction action
```

### Block 7: Secondary CTA
```
Content: "বোর্ড প্রশ্ন দেখুন"
Action: navigate('board-questions')
Purpose: Alternative for browse-mode visitors
```

### Block 8: Urgency Message (conditional)
```
Content: "{Exam Name}: {X} দিন বাকি — এখনই প্রস্তুতি শুরু করুন"
Purpose: Time-bound motivation during exam season
Config data: config?.homepageExam1Name, config?.homepageExam1Date
Logic: Show only if daysRemaining > 0 AND daysRemaining < 180
SSR safety: Server renders hidden, client calculates in useEffect
```

---

## 7. NoticeBar Relocation

### Current Layout (AppShell.tsx)
```
<Header />
<NoticeBar />          ← Above-the-fold (wastes 36px)
<main>
  {children}           ← HomePage renders HeroSection first
</main>
<Footer />
<BottomNav />
```

### New Layout
```
<Header />
<main>
  {children}           ← HomePage renders: HeroSection → NoticeBar → rest
</main>
<Footer />
<BottomNav />
```

### Changes Required

**AppShell.tsx:**
- Remove `{!isAdmin && <NoticeBar />}` from line 105

**HomePage.tsx:**
- Add `import NoticeBar from '@/components/shared/NoticeBar'`
- Add `<NoticeBar />` after `<HeroSection />` (between Hero and AchievementBadgesSection)

### Impact
- Saves 36px of above-the-fold space on all devices
- NoticeBar is still visible on the page — just below the Hero
- First-time visitors see the Hero without interruption
- Returning visitors who scroll see the NoticeBar in context

---

## 8. Updated Visual Flow (Above the Fold)

### Mobile (first screen)
```
┌─────────────────────────┐
│ Header: Logo · Search · Menu │  ← 56px
├─────────────────────────┤
│                         │
│ "৮০% কনটেন্ট বিনামূল্যে" │  ← Trust Badge
│                         │
│ "বোর্ড পরীক্ষায় A+       │  ← Headline (largest)
│  পেতে প্রস্তুত হোন"      │
│                         │
│ "সরকারি কারিকুলাম অনুযায়ী │  ← Supporting Sentence
│  লেকচার, MCQ, বোর্ড প্রশ্ন"│
│                         │
│ ভিডিও লেকচার · MCQ ·    │  ← Feature Strip [NEW]
│ বোর্ড প্রশ্ন · মডেল টেস্ট │
│                         │
│ ১০,০০০+ শিক্ষার্থী ·     │  ← Trust Message [MOVED UP]
│ ৫০,০০০+ MCQ · ৮০% ফ্রি  │
│                         │
│ ┌─────────────────────┐│
│ │  ফ্রি শুরু করুন       ││  ← Primary CTA
│ └─────────────────────┘│
│ ┌─────────────────────┐│
│ │ বোর্ড প্রশ্ন দেখুন    ││  ← Secondary CTA
│ └─────────────────────┘│
│                         │
│ SSC: ১৮০ দিন বাকি...    │  ← Urgency (conditional)
│                         │
├─────────────────────────┤
│ BottomNav: 5 icons      │  ← 56px
└─────────────────────────┘
```

### Desktop (first screen)
```
┌──────────────────────────────────────────────────────────┐
│ Logo · Nav (7 items) · Search · Theme · Login            │  ← 64px
├──────────────────────────────────────────────────────────┤
│                                                          │
│          "৮০% কনটেন্ট বিনামূল্যে"                         │  ← Trust Badge
│                                                          │
│          "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন"            │  ← Headline
│                                                          │
│          "সরকারি কারিকুলাম অনুযায়ী লেকচার, MCQ..."        │  ← Supporting Sentence
│                                                          │
│          ভিডিও লেকচার · MCQ · বোর্ড প্রশ্ন · মডেল টেস্ট   │  ← Feature Strip [NEW]
│                                                          │
│          ১০,০০০+ শিক্ষার্থী · ৫০,০০০+ MCQ · ৮০% ফ্রি     │  ← Trust Message [MOVED UP]
│                                                          │
│          ┌──────────────┐  ┌──────────────┐              │
│          │ ফ্রি শুরু করুন │  │বোর্ড প্রশ্ন দেখুন│              │  ← CTAs
│          └──────────────┘  └──────────────┘              │
│                                                          │
│          SSC: ১৮০ দিন বাকি — এখনই প্রস্তুতি শুরু করুন      │  ← Urgency (conditional)
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Responsive Behavior

### Mobile (< 768px)
- Trust badge: `text-xs`, `px-4 py-2`
- Headline: `text-3xl`
- Supporting sentence: `text-base`
- Feature strip: `text-xs`, centered, single line
- Trust message: `text-xs`, centered
- CTAs: stacked vertically, full width
- Urgency: `text-xs`, centered (when visible)
- Section height: `min-h-[70vh]` (without urgency) or `min-h-[75vh]` (with urgency)

### Desktop (≥ 768px)
- Trust badge: `text-sm`, `px-5 py-2.5`
- Headline: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
- Supporting sentence: `text-lg sm:text-xl`
- Feature strip: `text-sm`, centered, single line
- Trust message: `text-sm`, centered
- CTAs: horizontal, centered
- Urgency: `text-sm`, centered (when visible)
- Section height: `min-h-[85vh]` (without urgency) or `min-h-[88vh]` (with urgency)

---

## 10. Accessibility

- Badge: `<span>` — announces credibility
- Headline: `<h1>` — single h1 per page
- Supporting sentence: `<p>` — descriptive
- Feature strip: `<p>` with `aria-label="উপলব্ধ কনটেন্ট"` — screen reader lists content types
- Trust message: `<p>` — social proof
- CTAs: `<Button>` — keyboard nav, focus states
- Urgency: `<p>` with `role="status"` — time-sensitive announcement
- Bottom wave: `aria-hidden="true"` — decorative

---

## 11. Performance Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| JavaScript | ~3KB (canvas + parallax) | ~0.8KB (urgency calc) | ~73% reduction |
| Render complexity | 8 floating + 60 particles + 4 stat cards | 8 text elements + 2 buttons | ~70% reduction |
| Mobile CPU | High (canvas loop) | Low (one useEffect) | Significant |
| Layout shift | Potential (canvas, floating) | None (static text) | Improved CLS |
| FCP | Delayed by canvas | Immediate | Improved |
| LCP | May be delayed | Headline is LCP — immediate | Improved |

---

## 12. Implementation Steps

### Step 1: Modify AppShell.tsx
Remove `<NoticeBar />` from line 105 (between Header and main).

### Step 2: Modify HomePage.tsx
Import NoticeBar. Add `<NoticeBar />` after `<HeroSection />`.

### Step 3: Replace HeroSection.tsx
Replace entire file with new 8-block implementation (~160 lines).

### Step 4: Verify 8 blocks render in correct order
Badge → Headline → Supporting Sentence → Feature Strip → Trust Message → Primary CTA → Secondary CTA → Urgency (conditional)

### Step 5: Verify NoticeBar appears below Hero
Not above the fold. Visible after scrolling past the Hero.

### Step 6: Verify responsive behavior
Mobile (375px), tablet (768px), desktop (1440px).

### Step 7: Verify config overrides
heroBadge, heroTitle, heroSubtitle, homepageExam1Date, homepageExam1Name.

### Step 8: Verify urgency SSR safety
Server: hidden. Client: useEffect calc. No hydration mismatch.

### Step 9: Verify trust message loading
Static fallback when stats are 0. Dynamic when loaded.

### Step 10: Verify bottom wave
Transitions correctly to AchievementBadgesSection.

### Step 11: Verify no console errors
No React warnings, no hydration mismatches.

---

## 13. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| NoticeBar relocation breaks sticky behavior | Low | Medium | NoticeBar uses `sticky top-16` — will re-stick below Hero |
| Feature strip looks plain | Low | Low | Simple text with · separators — intentional minimalism |
| Config overrides break | Low | Medium | Same `config?.field \|\| 'fallback'` pattern |
| Urgency hydration mismatch | Medium | Medium | Server: hidden. Client: useEffect. Same as ExamCountdownSection. |
| Trust message shows "০" on cold start | Medium | Low | Static fallback when stats are 0 or loading |
| Bottom wave spacing changes | Low | Low | Same wave SVG and classes |
| Mobile layout breaks with 8 blocks | Low | Medium | Feature strip is single-line, trust message is single-line — minimal height addition |

---

## 14. Dependencies

| Dependency | Status |
|-----------|--------|
| `useSiteConfig()` | Already used — no changes |
| `usePublicStats()` | Already used — no changes |
| `useRouterStore` | Already used — no changes |
| `Button` component | Already used — no changes |
| `NoticeBar` component | Already exists — moved, not created |
| `globals.css` animations | Already defined — no changes |

**Zero new dependencies.**

---

## 15. Testing Checklist

- [ ] 8 blocks render in correct order on mobile
- [ ] 8 blocks render in correct order on desktop
- [ ] NoticeBar is below Hero (not above fold)
- [ ] Feature strip shows "ভিডিও লেকচার · MCQ প্র্যাকটিস · বোর্ড প্রশ্ন · মডেল টেস্ট"
- [ ] Trust message shows dynamic stats when loaded
- [ ] Trust message shows static fallback during loading
- [ ] Trust message shows "..." not "০" when stats are 0
- [ ] Primary CTA "ফ্রি শুরু করুন" navigates to class-list
- [ ] Secondary CTA "বোর্ড প্রশ্ন দেখুন" navigates to board-questions
- [ ] Urgency visible when exam < 180 days
- [ ] Urgency hidden when exam > 180 days
- [ ] Urgency hidden when no exam date configured
- [ ] No hydration mismatch on urgency
- [ ] Config overrides work for all fields
- [ ] Bottom wave transitions correctly
- [ ] No console errors
- [ ] No layout shift
- [ ] Mobile bottom nav functional
- [ ] Keyboard navigation works
- [ ] Screen reader reads all blocks

---

*This plan implements 8 content blocks, relocates NoticeBar below the fold, and adds feature strip for product discovery. 3 files modified. Zero new dependencies.*
