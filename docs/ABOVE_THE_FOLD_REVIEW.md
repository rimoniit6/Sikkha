# Above-the-Fold Experience Review

> **Scope:** Everything visible before the first scroll — Header, NoticeBar, Hero, BottomNav
> **Method:** Element-by-element analysis against user psychology and conversion goals
> **Constraint:** No UI discussion, no code — only information architecture and content strategy

---

## 1. What Information Is Still Missing?

| Missing Information | Who Needs It | Impact |
|--------------------|--------------|--------|
| **Product discovery** — visitor doesn't immediately know what content types exist (video lectures, MCQ, board questions, model tests, CQ, courses) | ALL visitors | HIGH — visitor can't answer "What can I do here?" |
| **Class-specific confirmation** — Class 6 student doesn't see "Class 6" in the Hero headline | Class 6 visitors | MEDIUM — headline says "board exam" which may not resonate |
| **Free content confirmation** — "80% free" is in the badge but not reinforced visually | Price-sensitive visitors | LOW — badge covers it, but reinforcement helps |
| **Content breadth** — no signal that the platform has thousands of lectures, not just MCQ | Video-focused visitors (YouTube journey) | MEDIUM — lectures are mentioned in supporting sentence but not prominently |

---

## 2. What Is Unnecessary?

| Element | Why It's Unnecessary | Severity |
|---------|---------------------|----------|
| **NoticeBar** above the fold | Takes 36px of vertical space. First-time visitors don't need platform announcements. Returning visitors can find notices in navigation. | HIGH |
| **Theme toggle** in Header | Utility function, not conversion-related.占用 space in the header. | LOW |
| **"View All" link** in NoticeBar | Premature — visitor hasn't read the notice yet. | LOW |

---

## 3. Can a Visitor Understand the Platform in Under 3 Seconds?

**Almost. But not quite.**

| Second | What the Visitor Processes | Comprehension |
|--------|--------------------------|---------------|
| 0–1 | Logo + site name + NoticeBar + Hero badge | "This is an education platform" |
| 1–2 | Headline: "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন" | "This helps me prepare for board exams" |
| 2–3 | Supporting sentence: "লেকচার, MCQ, বোর্ড প্রশ্ন" | "It has lectures, MCQ, and board questions" |

**Gap:** The visitor knows WHAT the platform does (board exam prep) but doesn't immediately discover the FULL scope of what's available. "Lectures, MCQ, board questions" is mentioned in the supporting sentence, but it's small text (text-base/text-lg at 85% opacity). The visitor may not process it in 3 seconds.

**Verdict: 85% comprehension in 3 seconds. Missing: product discovery.**

---

## 4. Can They Immediately Answer the 5 Core Questions?

### "What is this?"
**YES.** Headline: "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন" — immediately understood.

### "Is this for me?"
**PARTIALLY.** Headline says "board exam" which resonates with SSC/HSC. Supporting sentence says "Class 6 থেকে HSC" which covers all classes. But the headline's board-exam focus may confuse Class 6 students.

### "What can I do here?"
**NO.** This is the critical gap. The visitor can't immediately discover:
- Video classes
- MCQ practice
- Model tests
- Board questions
- Creative questions
- PDF notes
- Courses
- Progress tracking

The supporting sentence mentions "লেকচার, MCQ, বোর্ড প্রশ্ন" but it's not a product discovery mechanism — it's a subtitle.

### "Why should I trust it?"
**PARTIALLY.** Badge says "80% free" — addresses cost concern. But no social proof (student count, testimonials) is immediately visible. Trust message is below the CTAs.

### "What should I click?"
**YES.** Primary CTA "ফ্রি শুরু করুন" is clear and prominent.

---

## 5. What's Missing — Minimum Changes Required

### Missing: Product Discovery
**Minimum change:** Add a single feature strip between the supporting sentence and the CTAs. This strip lists the platform's content types as simple text or pills.

Content: "ভিডিও লেকচার · MCQ প্র্যাকটিস · বোর্ড প্রশ্ন · মডেল টেস্ট"

This immediately answers "What can I do here?" without requiring the visitor to read the supporting sentence.

### Missing: Trust Signal Near Headline
**Minimum change:** Move the trust message ("১০,০০০+ শিক্ষার্থী · ৫০,০০০+ MCQ · ৮০% ফ্রি") from below the CTAs to above the CTAs — between the feature strip and the primary CTA. This answers "Why should I trust it?" at the moment of decision.

---

## 6. Everything Currently Visible Above the Fold

### Mobile (first screen, no scroll)

| # | Element | Source |
|---|---------|--------|
| 1 | Header: Logo + site name | Header.tsx |
| 2 | Header: Search toggle (icon) | Header.tsx |
| 3 | Header: Theme toggle (icon) | Header.tsx |
| 4 | Header: Hamburger menu | Header.tsx |
| 5 | NoticeBar: Rotating announcement | NoticeBar.tsx |
| 6 | Hero: Badge | HeroSection.tsx |
| 7 | Hero: Headline | HeroSection.tsx |
| 8 | Hero: Supporting sentence | HeroSection.tsx |
| 9 | Hero: Primary CTA | HeroSection.tsx |
| 10 | Hero: Secondary CTA | HeroSection.tsx |
| 11 | Hero: Trust message | HeroSection.tsx |
| 12 | Hero: Urgency message (conditional) | HeroSection.tsx |
| 13 | BottomNav: 5 icons | BottomNav.tsx |

### Desktop (first screen, no scroll)

| # | Element | Source |
|---|---------|--------|
| 1 | Header: Logo + site name | Header.tsx |
| 2 | Header: Navigation (7 items) | Header.tsx |
| 3 | Header: Search bar | Header.tsx |
| 4 | Header: Theme toggle | Header.tsx |
| 5 | Header: Login button | Header.tsx |
| 6 | NoticeBar: Rotating announcement | NoticeBar.tsx |
| 7 | Hero: Badge | HeroSection.tsx |
| 8 | Hero: Headline | HeroSection.tsx |
| 9 | Hero: Supporting sentence | HeroSection.tsx |
| 10 | Hero: Primary CTA | HeroSection.tsx |
| 11 | Hero: Secondary CTA | HeroSection.tsx |
| 12 | Hero: Trust message | HeroSection.tsx |
| 13 | Hero: Urgency message (conditional) | HeroSection.tsx |

---

## 7. Element-by-Element Analysis

### Element 1: Header Logo + Site Name
- **Why it exists:** Brand identification
- **Earns its place?** YES — essential for brand recognition
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

### Element 2: Desktop Navigation (7 items)
- **Why it exists:** Primary navigation for desktop visitors
- **Earns its place?** YES — visitors need to find content
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

### Element 3: Desktop Search Bar
- **Why it exists:** High-intent visitor tool
- **Earns its place?** YES — search is the fastest path to content
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

### Element 4: Theme Toggle
- **Why it exists:** Light/dark mode switching
- **Earns its place?** NO — utility function, not conversion-related
- **Should stay?** YES (but not above the fold on mobile)
- **Should move?** On mobile, it's in the header — acceptable. On desktop, it's next to login — acceptable.
- **Should be removed?** NO — it's useful, just not conversion-critical

### Element 5: NoticeBar
- **Why it exists:** Platform announcements
- **Earns its place?** NO — first-time visitors don't need announcements. It consumes 36px of vertical space.
- **Should stay?** NO — move below the fold
- **Should move?** YES — move to a position below the Hero, or make it a dismissible overlay
- **Should be removed?** From above the fold: YES. From the page: NO (keep it below the fold)

**Impact of removing NoticeBar from above the fold:** Saves 36px of vertical space. On mobile, this means the Hero content is 36px higher — approximately 5% more of the viewport is available for the Hero.

### Element 6: Hero Badge
- **Why it exists:** Eliminate cost anxiety before headline is read
- **Earns its place?** YES — "80% free" is the strongest trust signal for price-sensitive visitors
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

### Element 7: Hero Headline
- **Why it exists:** Promise an outcome (A+ in board exams)
- **Earns its place?** YES — highest-impact content on the page
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

### Element 8: Hero Supporting Sentence
- **Why it exists:** Explain how the headline promise is delivered
- **Earns its place?** PARTIALLY — it mentions content types (lectures, MCQ, board questions) but as small text. A feature strip would serve this purpose better.
- **Should stay?** YES — but consider whether a feature strip could replace it
- **Should move?** NO
- **Should be removed?** NO — but supplement with feature strip

### Element 9: Hero Primary CTA
- **Why it exists:** Lowest-friction action
- **Earns its place?** YES — the entire Hero's purpose is to drive this click
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

### Element 10: Hero Secondary CTA
- **Why it exists:** Alternative for visitors not ready for primary action
- **Earns its place?** YES — captures visitors who need more information
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

### Element 11: Hero Trust Message
- **Why it exists:** Social proof at the moment of decision
- **Earns its place?** YES — but its current position (below CTAs) may be too late. Visitors decide before reaching it.
- **Should stay?** YES
- **Should move?** YES — move ABOVE the CTAs, between the feature strip and the primary CTA. This answers "Why should I trust it?" at the moment of decision.
- **Should be removed?** NO

### Element 12: Hero Urgency Message (conditional)
- **Why it exists:** Time-bound motivation during exam season
- **Earns its place?** YES — when visible, it's the strongest conversion driver
- **Should stay?** YES
- **Should move?** NO — it's correctly positioned below the trust message
- **Should be removed?** Only when exam is > 180 days away (already handled)

### Element 13: BottomNav (mobile)
- **Why it exists:** Primary navigation for mobile visitors
- **Earns its place?** YES — essential for mobile UX
- **Should stay?** YES
- **Should move?** NO
- **Should be removed?** NO

---

## 8. Product Discovery Check

The visitor must immediately discover that the platform contains:

| Content Type | Immediately Discoverable? | How? | Minimum Fix |
|-------------|--------------------------|------|-------------|
| Video Classes | NO — only mentioned in supporting sentence (small text) | Supporting sentence says "লেকচার" | Add to feature strip |
| MCQ Practice | PARTIALLY — mentioned in supporting sentence | Supporting sentence says "MCQ" | Add to feature strip |
| Model Tests | NO — not mentioned anywhere above the fold | — | Add to feature strip |
| Board Questions | YES — secondary CTA says "বোর্ড প্রশ্ন দেখুন" | Secondary CTA | Already covered |
| Creative Questions | NO — not mentioned above the fold | — | Add to feature strip |
| PDF Notes | NO — not mentioned above the fold | — | Add to feature strip (optional) |
| Courses | NO — not mentioned above the fold | — | Add to feature strip (optional) |
| Progress Tracking | NO — not mentioned above the fold | — | Not needed above the fold |

**Minimum change:** Add a feature strip with 4 items: "ভিডিও লেকচার · MCQ প্র্যাকটিস · বোর্ড প্রশ্ন · মডেল টেস্ট"

This immediately answers "What can I do here?" for every visitor type.

---

## 9. Single Primary Action Verification

| Action | Type | Destination | Correct? |
|--------|------|-------------|----------|
| "ফ্রি শুরু করুন" | Primary CTA | class-list | YES — lowest friction |
| "বোর্ড প্রশ্ন দেখুন" | Secondary CTA | board-questions | YES — lower commitment |

**There is ONE primary action.** The secondary CTA is visually subordinate (outline style vs filled style). The header navigation provides additional paths but doesn't compete with the Hero CTAs.

**PASS.**

---

## 10. Visual Hierarchy vs User Psychology

| Element | Visual Weight | Psychological Priority | Aligned? |
|---------|--------------|----------------------|----------|
| Headline | Highest (largest text) | Highest (the promise) | YES |
| Primary CTA | High (filled button) | Highest (the action) | YES |
| Badge | Medium (small text, above headline) | High (trust priming) | YES |
| Supporting sentence | Medium (subtitle text) | Medium (explains headline) | YES |
| Secondary CTA | Medium (outline button) | Medium (alternative action) | YES |
| Trust message | Low (small text below CTAs) | High (social proof) | NO — should be higher |
| Urgency message | Low (conditional, small text) | High (time pressure) | NO — should be higher |

**Issue:** Trust message and urgency message have low visual weight but high psychological importance. They should be more prominent — or at minimum, positioned where the visitor sees them before deciding.

**Fix:** Move trust message ABOVE the CTAs. Urgency message stays below trust message but above CTAs.

---

## 11. Can the First Screen Scale to 200+ Features?

**Yes — if the feature strip is designed as a representative sample, not an exhaustive list.**

The feature strip shows 4 content types (lectures, MCQ, board questions, model tests). When the platform grows to 200+ features, the strip still shows the 4 most important ones. The full feature set is discoverable through navigation and the Subject Explorer section below the fold.

The Hero's job is not to list all features — it's to communicate the core value proposition and get the visitor to take the first step. The feature strip serves this purpose without requiring updates as new features are added.

**PASS.**

---

## Final Checklist

| # | Check | Result | Minimum Change if FAIL |
|---|-------|--------|----------------------|
| 1 | Visitor understands "What is this?" in 3 seconds | **PASS** | — |
| 2 | Visitor understands "Is this for me?" in 3 seconds | **PASS** | — |
| 3 | Visitor understands "What can I do here?" in 3 seconds | **FAIL** | Add feature strip: "ভিডিও লেকচার · MCQ প্র্যাকটিস · বোর্ড প্রশ্ন · মডেল টেস্ট" |
| 4 | Visitor understands "Why should I trust it?" in 3 seconds | **FAIL** | Move trust message above CTAs |
| 5 | Visitor knows "What should I click?" in 3 seconds | **PASS** | — |
| 6 | Only ONE primary action exists | **PASS** | — |
| 7 | Visual hierarchy follows user psychology | **FAIL** | Move trust message and urgency message above CTAs |
| 8 | NoticeBar does not waste above-the-fold space | **FAIL** | Move NoticeBar below the Hero |
| 9 | Product discovery is immediate | **FAIL** | Add feature strip (same as #3) |
| 10 | First screen scales to 200+ features | **PASS** | — |

**Result: 4 FAIL items. The implementation plan must be updated.**

---

## Required Changes to Implementation Plan

### Change 1: Add Feature Strip (New Block between Supporting Sentence and Trust Message)

**New Block: Feature Strip**
```
Content: "ভিডিও লেকচার · MCQ প্র্যাকটিস · বোর্ড প্রশ্ন · মডেল টেস্ট"
Purpose: Immediately answer "What can I do here?" — product discovery
Position: Between supporting sentence and trust message
Style: Simple text line with separators (·), no icons, no cards
```

**Why this specific content:**
- "ভিডিও লেকচার" (Video Lectures) — addresses YouTube visitor journey
- "MCQ প্র্যাকটিস" (MCQ Practice) — addresses SSC/HSC visitor journey
- "বোর্ড প্রশ্ন" (Board Questions) — addresses highest-intent visitors
- "মডেল টেস্ট" (Model Tests) — addresses exam preparation visitors

These 4 items cover the platform's core content types. Other types (CQ, courses, PDF notes) are discoverable below the fold.

### Change 2: Reorder Trust Message and Urgency Message

**Current order:** CTAs → Trust Message → Urgency Message

**New order:** Feature Strip → Trust Message → CTAs → Urgency Message

This answers "Why should I trust it?" BEFORE the visitor is asked to click. The trust message is now between the product discovery and the action — the optimal position for conversion.

### Change 3: Move NoticeBar Below the Hero

**Current:** NoticeBar is above the Hero (between Header and Hero)

**New:** NoticeBar is below the Hero (between Hero and AchievementBadgesSection)

This saves 36px of above-the-fold space and removes a distraction for first-time visitors. The NoticeBar is still visible on the page — just not in the first screen.

**Implementation:** Move `<NoticeBar />` from AppShell.tsx (above main content) to HomePage.tsx (below HeroSection). This requires modifying 2 files: `AppShell.tsx` and `HomePage.tsx`.

### Change 4: Updated Hero Content Structure (8 blocks)

```
Block 1: Trust Badge — "৮০% কনটেন্ট বিনামূল্যে"
Block 2: Headline — "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন"
Block 3: Supporting Sentence — "সরকারি কারিকুলাম অনুযায়ী লেকচার, প্র্যাকটিস MCQ ও বোর্ড প্রশ্ন — ৮০% কনটেন্ট বিনামূল্যে"
Block 4: Feature Strip — "ভিডিও লেকচার · MCQ প্র্যাকটিস · বোর্ড প্রশ্ন · মডেল টেস্ট" [NEW]
Block 5: Trust Message — "১০,০০০+ শিক্ষার্থী · ৫০,০০০+ MCQ · হাজার হাজার লেকচার · ৮০% ফ্রি" [MOVED UP]
Block 6: Primary CTA — "ফ্রি শুরু করুন"
Block 7: Secondary CTA — "বোর্ড প্রশ্ন দেখুন"
Block 8: Urgency Message — conditional countdown [MOVED DOWN relative to trust]
```

**Why this order:**
1. Badge eliminates cost anxiety (before headline)
2. Headline promises outcome (A+ in board exams)
3. Supporting sentence explains how (curriculum-aligned content)
4. Feature strip shows what's available (product discovery)
5. Trust message proves credibility (social proof before action)
6. Primary CTA captures high-intent visitors
7. Secondary CTA captures browse-mode visitors
8. Urgency message creates time pressure (amplifies everything above)

### Files Modified (Updated)

| File | Change | Reason |
|------|--------|--------|
| `src/components/home/HeroSection.tsx` | Full rewrite with 8 blocks | Primary target |
| `src/components/layout/AppShell.tsx` | Move `<NoticeBar />` from above main to below Hero | Remove NoticeBar from above-the-fold |
| `src/components/home/HomePage.tsx` | Add `<NoticeBar />` below HeroSection | Receive NoticeBar from AppShell |

---

*This review identified 4 FAIL items. All can be addressed with 3 changes: add feature strip, reorder trust/CTAs, move NoticeBar below fold. The implementation plan requires updating to incorporate these changes.*
