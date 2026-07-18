# Hero Section Discovery Report — Sikkha (শিক্ষা বাংলা)

> **Date:** 2026-07-18
> **Analyst Role:** Senior Product Designer, UX Researcher, CRO Expert, EdTech Product Strategist
> **Scope:** Full homepage analysis with deep focus on Hero Section and first-time visitor experience
> **Method:** Source-code inspection of all 25 homepage section components, navigation system, routing, FEATURES.md, README.md, and AppShell layout

---

## 1. What is this product?

**Sikkha (শিক্ষা বাংলা)** is a Bangladeshi online learning platform targeting students from **Class 6 through HSC (Higher Secondary Certificate)**. It is a full-stack EdTech application built with Next.js 16, React 19, Prisma/SQLite, and a custom SPA-in-SSR architecture.

The platform provides:
- **Lectures** (video/text) organized by Class → Subject → Chapter hierarchy
- **MCQ practice** with a massive question bank (50,000+ questions)
- **Creative Questions (CQ)** with detailed solutions
- **Board Question archives** from past exams across all Bangladeshi education boards
- **Custom exam creation** for students and teachers
- **MCQ and CQ exam packages** with timed exams, grading, and retake systems
- **Courses** with lessons, assignments, progress tracking, and certificates
- **Premium content** gating with manual payment (bKash/Nagad/Rocket)
- **Knowledge/Short questions** bank
- **Exam suggestions** curated content
- **Notice board** for announcements
- **Teacher/Moderator directory**
- **Student testimonials and showcase**

**Revenue model:** Freemium — free content for all, premium content behind paywall (manual payment, admin approval).

---

## 2. What problem does it solve?

**Primary problem:** Bangladeshi students (Class 6–HSC) lack a centralized, organized, affordable digital learning platform that covers their full curriculum — from lectures to board exam preparation.

**Specific pain points addressed:**
- **Fragmented study materials** — students currently jump between YouTube, random PDFs, Facebook groups, and physical books
- **No structured exam preparation** — board question practice is scattered across physical guides
- **No access to model tests** — students can't easily simulate real exam conditions
- **Language barrier** — most global EdTech platforms don't serve Bangla-medium students
- **Cost** — quality coaching/tutoring is expensive; this platform offers 80% free content
- **Accessibility** — students need mobile-first access (most Bangladeshi students access internet via mobile)

---

## 3. Who are the primary users?

| Segment | Description | Needs |
|---------|-------------|-------|
| **Primary: Class 6–10 students** | Bangla-medium students preparing for SSC and below | Lectures, MCQ practice, board questions, free content |
| **Secondary: HSC students** | Higher secondary students preparing for university admission | Advanced MCQ, CQ solutions, model tests, exam suggestions |
| **Tertiary: Teachers/Moderators** | Content creators and educators | Content management, custom exam creation |
| **Admin: Platform operators** | Content managers, payment reviewers | Full CRUD, analytics, payment approval |

**Key behavioral insight:** The target audience is overwhelmingly **mobile-first** (likely 80%+ on smartphones), price-sensitive (freemium model essential), and Bangla-first (all UI in Bengali).

---

## 4. What are all the major features currently available?

Based on source code and FEATURES.md (62 catalogued features):

| Category | Features |
|----------|----------|
| **Content Hierarchy** | Class 6→HSC, Subjects, Chapters, Topics |
| **Learning Content** | Lectures (video/text), Resources, Notes |
| **Question Banks** | MCQ (50K+), CQ (creative), Knowledge/Short Questions |
| **Board Questions** | Past board exam questions with board/year/subject filters |
| **Exam System** | Custom exam creator, MCQ exam packages, CQ exam packages, timed exams, grading, retake requests |
| **Courses** | Full course system with lessons, assignments, progress, certificates |
| **Premium** | Content gating, bundles, packages, manual payment (bKash/Nagad/Rocket) |
| **Discovery** | Global search, featured content, recent content, subject explorer |
| **Social Proof** | Testimonials, student showcase, teacher directory |
| **Communication** | Notice board, FAQ, contact form |
| **User Features** | Dashboard, bookmarks, notes, progress tracking, recently viewed |
| **Admin** | 34 admin pages, 22 analytics sub-routes, full CRUD, bulk import, audit logging |

---

## 5. Which features are visible to first-time visitors?

**On the homepage (17 sections in order):**

| # | Section | Visible to Guest? | Purpose |
|---|---------|-------------------|---------|
| 1 | HeroSection | Yes | Value proposition + CTA |
| 2 | AchievementBadgesSection | Yes | Platform statistics |
| 3 | QuickSearchSection | Yes | Search functionality |
| 4 | SubjectExplorerSection | Yes | Browse subjects by class |
| 5 | RecentContentSection | Yes | Latest MCQ content |
| 6 | NoticeBoardSection | Yes | Announcements |
| 7 | WhyChooseUsSection | Yes | Feature comparison |
| 8 | FeaturedCourses | Yes | Curated content |
| 9 | EnhancedStatsSection | Yes | Animated statistics |
| 10 | ExamCountdownSection | Yes | Board exam countdown |
| 11 | BoardQuestionSection | Yes | Board question quick-start |
| 12 | PremiumBanner | Yes | Premium upsell |
| 13 | TeacherModeratorsSection | Yes | Teacher directory |
| 14 | StudentShowcaseSection | Yes | Student testimonials |
| 15 | FAQSection | Yes | Common questions |
| 16 | NewsletterSection | Yes | Contact form |
| 17 | CTASection | Yes | Registration CTA |

**In the header navigation (DB-driven):**
- Home, Classes, Exam Center, Suggestions, Board Questions, Notices, Premium, Login

**In the bottom nav (mobile, DB-driven):**
- Home, Classes, Exam Center, Suggestions, User Dashboard (auth-only)

---

## 6. Which important features are hidden?

| Feature | Why it's hidden | Impact |
|---------|----------------|--------|
| **Courses** | Not in the live Navigation DB table — only in code fallback (never used) | HIGH — full course system with enrollment, lessons, assignments, certificates is invisible |
| **MCQ Practice** | No direct homepage link; only accessible via class drill-down or search | HIGH — core value proposition buried |
| **CQ Solutions** | Only accessible via class drill-down | MEDIUM — key differentiator hidden |
| **Knowledge Questions** | Only via class drill-down | MEDIUM — short question bank invisible |
| **Custom Exam Creator** | Only accessible after login, no homepage mention | MEDIUM — powerful feature for students |
| **Bookmarks** | Only after login, no homepage mention | LOW — retention feature |
| **Certificates** | No mention anywhere on homepage | LOW — completion motivation |
| **Progress Tracking** | No mention on homepage | LOW — engagement feature |
| **User Dashboard** | Only after login | EXPECTED — auth-gated |
| **Search** | Available but secondary (below Hero, then again in header) | MEDIUM — search is powerful but not prominent |

---

## 7. Can a visitor understand the platform within 3 seconds?

**No.** Here is the 3-second experience breakdown:

**Second 1:** The visitor sees a green gradient background with animated particles and floating icons. A badge says "বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম" (Bangladesh's best online learning platform).

**Second 2:** The heading reads "বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম" (Bangladesh's best education platform). The subtitle says "Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন" (Lectures, MCQ, creative questions and board questions for all subjects from Class 6 to HSC).

**Second 3:** Two CTAs appear: "শিক্ষা শুরু করুন" (Start learning) and "প্রিমিয়াম দেখুন" (See premium). Stats show below.

**Problems with the 3-second test:**
1. The value proposition is **generic** — "best education platform" says nothing specific about what makes it different
2. The subtitle is a **feature list**, not a **benefit statement** — it tells WHAT the platform has, not WHY a student should care
3. There is no **social proof** visible in the Hero — no student count, no success story, no trust signal
4. The particle animation and floating icons are **visual noise** that delays content comprehension
5. The two CTAs compete — "Start learning" vs "See premium" forces a decision before the visitor understands the product

---

## 8. What is the current value proposition?

**Badge:** "বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম" (Bangladesh's best online learning platform)

**Headline:** "বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম" (Bangladesh's best education platform)

**Subtitle:** "Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন" (Lectures, MCQ, creative questions and board questions for all subjects from Class 6 to HSC)

**In plain English:** "Bangladesh's best education platform. Lectures, MCQ, creative questions, and board questions for all subjects from Class 6 to HSC."

---

## 9. What should the value proposition be instead?

The current value proposition makes three critical mistakes:
1. **Claims superiority without proof** — "best" is an empty claim
2. **Lists features, not outcomes** — students don't want "MCQ" — they want "to pass their board exam with a good GPA"
3. **Doesn't differentiate** — this reads like any other Bangladeshi EdTech platform

**Recommended value proposition direction:**

> **Badge:** "৮০% কনটেন্ট বিনামূল্যে" (80% content is free)
>
> **Headline:** "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন" (Prepare to get A+ in board exams)
>
> **Subtitle:** "Class 6 থেকে HSC — লেকচার, প্র্যাকটিস MCQ, বোর্ড প্রশ্ন ও মডেল টেস্ট এক জায়গায়" (Class 6 to HSC — Lectures, practice MCQ, board questions, and model tests in one place)

**Why this works better:**
- Leads with the **outcome** (A+ in board exams) not the platform claim
- Highlights the **free** angle (80% free content is a massive differentiator in Bangladesh)
- The subtitle is still feature-rich but framed as a **student journey** (learn → practice → test)
- "এক জায়গায়" (in one place) addresses the fragmentation problem

---

## 10. What emotions does the current Hero create?

| Emotion | Evidence | Intensity |
|---------|----------|-----------|
| **Mild curiosity** | Animated particles, floating icons create visual interest | Low |
| **Generic trust** | "Best platform" claim, stat numbers | Very Low |
| **Slight overwhelm** | Too many visual elements competing for attention | Medium |
| **Indifference** | No specific promise, no social proof, no urgency | High |
| **Uncertainty** | Two competing CTAs, unclear primary action | Medium |

**Net emotional result:** The visitor feels "this is another EdTech site" — nothing memorable, nothing compelling, nothing that creates urgency to act.

---

## 11. What emotions should it create?

The Hero should create, in order:

1. **Recognition** — "This is exactly for ME" (a Class 10 student preparing for SSC)
2. **Relief** — "Finally, something organized that covers my full syllabus"
3. **Trust** — "10,000+ students already use this, and 80% is free"
4. **Urgency** — "My board exam is in X days, I should start NOW"
5. **Confidence** — "I can do this — the path is clear"

**Emotional journey:** Recognition → Relief → Trust → Urgency → Action

---

## 12. What are the biggest UX mistakes?

### Mistake 1: The Hero is visually noisy but informationally empty
- **What:** Canvas particle system, 8 floating icons, mouse parallax, gradient overlays, pulsing rings, shimmer animations
- **Impact:** The visitor's eye has nowhere to land. The visual "wow" competes with the actual message.
- **Fix:** Remove or drastically reduce decorative elements. Let the message breathe.

### Mistake 2: The value proposition is a feature list, not a promise
- **What:** "Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন"
- **Impact:** Students don't search for "MCQ" — they search for "SSC গণিত MCQ" or "HSC পদার্থবিজ্ঞান সমাধান"
- **Fix:** Lead with the student's goal, not the platform's inventory.

### Mistake 3: Stats are repeated THREE times
- **What:** Stats appear in HeroSection (4 stats), AchievementBadgesSection (6 stats), and EnhancedStatsSection (5 stats) — all showing the same data
- **Impact:** Feels like padding. Diminishes the credibility of the numbers.
- **Fix:** Keep stats in ONE section. Choose the most impactful presentation.

### Mistake 4: No social proof in the Hero
- **What:** Zero testimonials, zero student faces, zero success stories above the fold
- **Impact:** New visitors have no reason to trust the platform
- **Fix:** Add 1-2 testimonial snippets or a student count with real names/photos

### Mistake 5: Two competing CTAs with no hierarchy
- **What:** "শিক্ষা শুরু করুন" (Start learning) and "প্রিমিয়াম দেখুন" (See premium) — both styled equally
- **Impact:** Decision paralysis. The visitor doesn't know which action is "correct"
- **Fix:** One primary CTA (Start learning / Browse classes) and one secondary (text link or ghost button)

### Mistake 6: No urgency mechanism
- **What:** No exam countdown in Hero (it's buried 10 sections down), no "X days until SSC" message
- **Impact:** No reason to act NOW vs. later
- **Fix:** If exam season is relevant, show countdown in Hero. Otherwise, use a different urgency trigger.

### Mistake 7: The search bar is below the fold
- **What:** QuickSearchSection is the 3rd section (below Hero and AchievementBadges)
- **Impact:** Students who know what they want (most returning users) can't immediately search
- **Fix:** Consider embedding search in the Hero or making it immediately accessible

### Mistake 8: 17 sections is excessive
- **What:** The homepage has 17 distinct sections — far beyond the recommended 5-7 for conversion
- **Impact:** Scroll fatigue. Key messages get buried. Load time increases.
- **Fix:** Ruthlessly prioritize. Move secondary content to dedicated pages.

---

## 13. What are the biggest conversion mistakes?

### Conversion Mistake 1: No clear conversion goal
The homepage has **5 different CTAs** competing for attention:
1. "শিক্ষা শুরু করুন" (Start learning) → class-list
2. "প্রিমিয়াম দেখুন" (See premium) → premium
3. "নিবন্ধন করুন" (Register) → register (in CTASection at bottom)
4. "বান্ডেল দেখুন" (See bundles) → premium (in PremiumBanner)
5. "প্রস্তুতি শুরু করুন" (Start preparation) → exam-center (in ExamCountdown)

**Impact:** No funnel. The visitor is scattered across 5 different destinations.
**Fix:** Define ONE primary conversion goal (e.g., "Browse free content" or "Register") and make every section support that goal.

### Conversion Mistake 2: Registration is buried
- **What:** The register CTA is at the BOTTOM of the page (CTASection — section 17 of 17)
- **Impact:** Most visitors never reach it. The Hero CTA goes to class-list (browse), not register.
- **Fix:** Registration should be in the Hero, in the header, and reinforced mid-page.

### Conversion Mistake 3: No value demonstration before asking for action
- **What:** The Hero asks visitors to "Start learning" before showing any actual content
- **Impact:** No trust → no click
- **Fix:** Show a preview of actual content (a sample MCQ, a lecture thumbnail, a board question) before the CTA

### Conversion Mistake 4: Premium is promoted too early
- **What:** PremiumBanner is section 12 of 17 — relatively prominent for visitors who haven't seen value yet
- **Impact:** Premature monetization push creates resistance
- **Fix:** Show free value first. Premium should come AFTER demonstrating the platform's worth.

### Conversion Mistake 5: No email capture / lead magnet
- **What:** NewsletterSection is a contact form, not a newsletter signup
- **Impact:** No way to capture leads and nurture them
- **Fix:** Offer a free resource (e.g., "Download SSC Math formula sheet") in exchange for email

### Conversion Mistake 6: No exit-intent or scroll-triggered CTA
- **What:** Once a visitor scrolls past the Hero, there's no mechanism to re-engage
- **Impact:** Lost visitors are lost forever
- **Fix:** Add a sticky header CTA, scroll-triggered mid-page CTA, or exit-intent popup

---

## 14. If this were your startup, what would you completely remove?

| Section | Reason for removal |
|---------|-------------------|
| **AchievementBadgesSection** | Redundant with HeroStats and EnhancedStats. Stats appear 3 times — remove 2 of 3. |
| **EnhancedStatsSection** | Same data as Hero stats and AchievementBadges. One stats section is enough. |
| **RecentContentSection** | Shows raw MCQ text to unauthenticated visitors — not compelling, no conversion value. Move to a dedicated "Browse" page. |
| **NoticeBoardSection** | Important but not conversion-driving. Move to a link in the header or a sidebar. |
| **NewsletterSection** (contact form) | A contact form on the homepage is not a conversion tool. Move to a dedicated Contact page or replace with a lead magnet. |
| **FAQSection** | Good for SEO but not for conversion. Move below the fold or to a dedicated page. |
| **SpecialNoticePopup** | Modal popups on first visit are hostile UX. Remove entirely or make it a banner. |
| **HeroNoticeBar** | Adds visual noise to the Hero. If important, make it a subtle top bar. |
| **ParticleCanvas** | Pure decoration. Adds 0 conversion value. Remove. |
| **Floating elements (parallax icons)** | Pure decoration. Remove. |
| **Mouse parallax** | Gimmick. Remove. |

**Net result:** Remove 11 sections/elements. The homepage goes from 17 sections to 6-7 focused sections.

---

## 15. What would you add?

| Addition | Purpose | Priority |
|----------|---------|----------|
| **Hero testimonial snippet** | "১০,০০০+ শিক্ষার্থী ইতিমধ্যে ব্যবহার করছেন — আপনিও যোগ দিন" with 2-3 student faces | CRITICAL |
| **Exam countdown in Hero** | "SSC 2026 পরীক্ষা: ১৮০ দিন বাকি" — creates urgency | HIGH |
| **Free content preview** | Show 1 sample MCQ or board question with answer — demonstrate value before asking for action | HIGH |
| **"How it works" 3-step section** | "ক্লাস বাছান → পড়ুন → পরীক্ষা দিন" — reduces cognitive load | HIGH |
| **Class-specific landing** | If user has selected a class, Hero should say "Class 10 SSC প্রস্তুতি" not generic "Best platform" | HIGH |
| **Sticky header CTA** | Always-visible "ফ্রি শুরু করুন" button in the header | MEDIUM |
| **Progress indicator** | "আপনার পড়াশোনা ৭০% সম্পন্ন" for returning logged-in users | MEDIUM |
| **Trust badges** | "SSL সুরক্ষিত", "২৪/৭ সাপোর্ট", "রিফান্ড গ্যারান্টি" near payment CTAs | MEDIUM |

---

## 16. What information should appear above the fold?

**Above the fold = everything visible without scrolling on a standard mobile device (iPhone SE / Galaxy A series) and desktop.**

### Recommended Above-the-Fold Content:

**Mobile (first-time visitor):**
1. **Logo + Navigation** (already exists)
2. **Hero Headline:** "বোর্ড পরীক্ষায় A+ পেতে প্রস্তুত হোন" (or class-specific)
3. **Hero Subtitle:** One sentence about what the platform offers
4. **Primary CTA:** "ফ্রি শুরু করুন" (Start free)
5. **Secondary CTA:** "বোর্ড প্রশ্ন দেখুন" (View board questions — text link)
6. **Trust signal:** "১০,০০০+ শিক্ষার্থী | ৫০,০০০+ MCQ | ৮০% ফ্রি"
7. **1 testimonial snippet** with student name and class

**Desktop:**
- Same content, but with more breathing room
- Consider a split layout: left = text + CTA, right = content preview (e.g., sample MCQ card)

### What should NOT be above the fold:
- Particle animations
- Floating icons
- Premium upsell
- Multiple CTAs
- Stats grids (one trust line is enough)

---

## 17. Which information should move below the Hero?

| Current Section | Move Below? | New Position |
|----------------|-------------|--------------|
| AchievementBadgesSection | REMOVE (redundant) | N/A |
| QuickSearchSection | Yes — below Hero | Position 2 (immediately after Hero) |
| SubjectExplorerSection | Yes — below Hero | Position 3 |
| RecentContentSection | REMOVE or move to /browse | N/A or dedicated page |
| NoticeBoardSection | Yes — below Hero | Position 4 (or link in nav) |
| WhyChooseUsSection | Yes — below Hero | Position 5 |
| FeaturedCourses | Yes — below Hero | Position 6 |
| EnhancedStatsSection | REMOVE (redundant) | N/A |
| ExamCountdownSection | Yes — below Hero | Position 7 (or in Hero if exam season) |
| BoardQuestionSection | Yes — below Hero | Position 8 |
| PremiumBanner | Yes — below Hero | Position 9 (after free value is shown) |
| TeacherModeratorsSection | Yes — below Hero | Position 10 |
| StudentShowcaseSection | Yes — below Hero | Position 11 |
| FAQSection | Yes — below Hero | Position 12 |
| NewsletterSection | REMOVE or move to /contact | N/A |
| CTASection | Yes — bottom of page | Final position |

---

## 18. Rank all homepage sections by importance.

| Rank | Section | Importance | Reason |
|------|---------|------------|--------|
| 1 | **HeroSection** | CRITICAL | First impression, value proposition, primary CTA |
| 2 | **QuickSearchSection** | HIGH | Active intent — students who know what they want |
| 3 | **SubjectExplorerSection** | HIGH | Core navigation — browse by class/subject |
| 4 | **ExamCountdownSection** | HIGH | Urgency driver — time-bound motivation |
| 5 | **BoardQuestionSection** | HIGH | Key differentiator — board question practice |
| 6 | **WhyChooseUsSection** | MEDIUM-HIGH | Trust building — why this platform |
| 7 | **FeaturedCourses** | MEDIUM | Content showcase — demonstrate quality |
| 8 | **StudentShowcaseSection** | MEDIUM | Social proof — testimonials |
| 9 | **PremiumBanner** | MEDIUM | Revenue — but only after value is demonstrated |
| 10 | **TeacherModeratorsSection** | MEDIUM | Trust — real people behind the platform |
| 11 | **NoticeBoardSection** | LOW-MEDIUM | Important but not conversion-driving |
| 12 | **FAQSection** | LOW | SEO value, but not conversion-critical |
| 13 | **CTASection** | LOW | Redundant with Hero CTA |
| 14 | **AchievementBadgesSection** | REMOVE | Redundant with Hero stats |
| 15 | **EnhancedStatsSection** | REMOVE | Redundant with Hero stats |
| 16 | **RecentContentSection** | REMOVE/MOVE | Not compelling for first-time visitors |
| 17 | **NewsletterSection** | REMOVE/MOVE | Contact form, not a conversion tool |

---

## 19. What should a first-time visitor see first?

### Ideal First-Time Visitor Journey (in order):

**Second 0-3: Hero**
- Clear headline addressing the student's goal (exam preparation)
- One-sentence subtitle explaining what the platform offers
- Single primary CTA: "ফ্রি শুরু করুন"
- One trust signal line: "১০,০০০+ শিক্ষার্থী | ৫০,০০০+ MCQ | ৮০% ফ্রি"
- Optional: 1 exam countdown if in exam season

**Second 3-10: Quick Search**
- Search bar with popular suggestions
- "আপনি কী খুঁজছেন?" (What are you looking for?)

**Second 10-20: Subject Explorer**
- Class selection tabs (Class 6, 7, 8, SSC, HSC)
- Subject cards for the selected class
- "সব বিষয় দেখুন" button

**Second 20-30: Board Questions / Exam Prep**
- Board question quick-start with class selection
- Exam countdown (if applicable)
- "দ্রুত শুরু" (Quick start) CTA

**Second 30-45: Trust Building**
- Why choose us (6 features)
- 1-2 student testimonials
- Teacher directory

**Second 45-60: Conversion**
- Premium upsell (after free value is demonstrated)
- Registration CTA
- FAQ (if questions remain)

---

## 20. Compare this homepage with best practices used by modern EdTech platforms.

### Comparison Matrix

| Dimension | Sikkha (Current) | Best Practice (Byju's, Unacademy, Khan Academy, Brilliant) | Gap |
|-----------|------------------|-------------------------------------------------------------|-----|
| **Hero clarity** | Generic "best platform" claim | Specific outcome: "Master math", "Crack NEET", "Learn for free" | HIGH — Sikkha's Hero is vague |
| **Social proof in Hero** | None | Student count, success stories, ratings in Hero | HIGH — No trust signals in Hero |
| **Content preview** | None | Sample lesson, interactive demo, preview card | HIGH — Visitor can't see actual content |
| **Personalization** | None (generic for all visitors) | "Select your class" → personalized Hero | HIGH — Every visitor sees the same content |
| **Urgency** | Exam countdown buried 10 sections deep | Countdown in Hero, limited-time offers, streaks | HIGH — No urgency mechanism |
| **Single CTA** | 5 competing CTAs | One primary CTA per section | HIGH — CTA confusion |
| **Section count** | 17 sections | 5-7 sections max | HIGH — Scroll fatigue |
| **Mobile optimization** | Good (responsive, bottom nav) | Excellent (thumb-friendly, progressive disclosure) | LOW — Mobile is already good |
| **Search prominence** | Below fold | In Hero or sticky header | MEDIUM — Search is secondary |
| **Free value demo** | None | Show free content, let users try before committing | HIGH — No try-before-you-buy |
| **Onboarding** | None | "Pick your class" wizard on first visit | HIGH — No guided onboarding |
| **Progress visualization** | None on homepage | Dashboard preview, progress bars, achievements | MEDIUM — Expected for logged-in users |
| **Video content** | No video in Hero | Demo video, teacher introduction video | MEDIUM — Video builds trust fast |
| **Testimonials** | Section 14 (near bottom) | In Hero or immediately below | HIGH — Social proof is buried |
| **Loading performance** | Canvas particles + 17 sections = heavy | Lightweight Hero, lazy-load below fold | MEDIUM — Performance impact |

### Key Takeaways from Comparison:

1. **Byju's/Unacademy pattern:** Hero has a clear " Crack [Exam Name]" headline + a demo lesson card + student count. Sikkha should adopt this.

2. **Khan Academy pattern:** "Start learning for free" is the primary message, with a "Choose your path" wizard. Sikkha already has class selection but it's not in the Hero.

3. **Brilliant pattern:** Interactive content preview in the Hero — visitors can try a problem before signing up. Sikkha should show a sample MCQ.

4. **Common EdTech pattern:** "Join X students who [achieved Y]" is always above the fold. Sikkha has this data (10,000+ students) but doesn't surface it.

---

## Summary of Critical Findings

### The 5 Most Impactful Problems:

1. **The value proposition is empty** — "Best education platform" means nothing. It should promise an outcome (A+ in board exams) or highlight a differentiator (80% free, organized curriculum).

2. **No social proof in the Hero** — 10,000+ students use this platform, but a first-time visitor has no way to know that without scrolling to section 14.

3. **17 sections create scroll fatigue** — The homepage should have 6-7 focused sections. Remove redundant stats (3x repetition), redundant CTAs, and sections that don't drive conversion.

4. **No urgency mechanism** — The exam countdown is buried. For an EdTech platform targeting exam students, urgency is the #1 conversion driver.

5. **Courses feature is invisible** — A complete course system with enrollment, lessons, assignments, and certificates exists but is unreachable from navigation.

### The 3 Quick Wins:

1. **Remove particles, floating icons, and parallax** — Instant Hero clarity improvement with zero feature loss.

2. **Move exam countdown to Hero** — One line: "SSC 2026: ১৮০ দিন বাকি — প্রস্তুতি শুরু করুন" creates immediate urgency.

3. **Add one testimonial to Hero** — "রাইসা, ক্লাস 10: 'এই প্ল্যাটফর্মে MCQ প্র্যাকটিস করে A+ পেয়েছি'" — instant trust.

---

*This report is based on source-code inspection, not live user testing. All findings should be validated with actual user research (usability testing, heatmaps, A/B tests) before implementation.*
