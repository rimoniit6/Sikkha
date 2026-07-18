# Homepage Conversion Audit

> **Method:** Imagine 5 first-time visitor types. Inspect the rendered homepage (not code).
> **Scope:** Hero → NoticeBar → Quick Search flow + overall conversion score

---

## Visitor 1: Class 6 Student

**What they notice first:** The "৮০% কনটেন্ট বিনামূল্যে" badge. Cost anxiety is eliminated immediately.

**What they understand in 3 seconds:** "This is a free education platform. It covers Class 6 to HSC. It has video lectures, MCQ, and board questions."

**What they want to click:** "ফ্রি শুরু করুন" — the primary CTA. The word "ফ্রি" (free) matches their intent.

**First confusion:** None. The badge, headline, and feature strip all align with their needs.

**Would they click the CTA or scroll?** Click. The CTA is visible, prominent, and matches their intent.

**If they scroll, first section reached:** NoticeBar (announcements). Not relevant to them.

**Is that the correct next step?** No. Quick Search or Subject Explorer would be better. But the NoticeBar is only 36px — they'll scroll past it quickly.

---

## Visitor 2: SSC Candidate

**What they notice first:** The headline "Class 6 থেকে HSC পর্যন্ত A+ পেতে প্রস্তুত হোন". "HSC" and "A+" are visible.

**What they understand in 3 seconds:** "This platform helps students get A+ in board exams. It covers SSC through HSC."

**What they want to click:** "ফ্রি শুরু করুন" or "বোর্ড প্রশ্ন দেখুন". Both match their intent.

**First confusion:** None. The feature strip confirms MCQ, board questions, and model tests exist.

**Would they click the CTA or scroll?** Click. The primary CTA is the fastest path to content.

**If they scroll, first section reached:** NoticeBar → AchievementBadges (stats). The stats are redundant with the Hero trust message.

**Is that the correct next step?** AchievementBadges is not the best next step. Quick Search would be better for an SSC candidate with specific intent.

---

## Visitor 3: HSC Candidate

**What they notice first:** The headline — "HSC" is explicit in "Class 6 থেকে HSC পর্যন্ত".

**What they understand in 3 seconds:** "This covers HSC. It promises A+ results."

**What they want to click:** "ফ্রি শুরু করুন" — explore HSC content.

**First confusion:** None.

**Would they click the CTA or scroll?** Click.

**If they scroll, first section reached:** NoticeBar → AchievementBadges.

**Is that the correct next step?** No. Quick Search would be better.

---

## Visitor 4: Parent

**What they notice first:** The "৮০% কনটেন্ট বিনামূল্যে" badge. Cost is the primary concern.

**What they understand in 3 seconds:** "This is mostly free. It covers all classes. It has video lectures and MCQ."

**What they want to click:** "ফ্রি শুরু করুন" — verify the platform is legitimate.

**First confusion:** None. The trust message ("১০,০০০+ শিক্ষার্থী") provides social proof.

**Would they click the CTA or scroll?** Click — then evaluate. Parents browse before committing.

**If they scroll, first section reached:** NoticeBar → AchievementBadges (redundant stats) → Quick Search.

**Is that the correct next step?** Quick Search is good for parents who want to find specific content for their child.

---

## Visitor 5: Returning User

**What they notice first:** The header search bar. They know the platform — they need to find content quickly.

**What they understand in 3 seconds:** "I'm on the homepage. I can search or use the nav."

**What they want to click:** The search bar (header) or a nav item.

**First confusion:** None. They bypass the Hero entirely.

**Would they click the Hero CTA or scroll?** Neither. They use the header.

**If they scroll, first section reached:** NoticeBar (may check for new announcements).

**Is that the correct next step?** Yes — returning users check announcements for updates.

---

## Flow Evaluation: Hero → NoticeBar → Quick Search

### Does the flow feel natural?

**Partially.** The transition has two issues:

1. **Hero → NoticeBar:** The Hero ends with a bottom wave (white-to-background transition). The NoticeBar starts with a green gradient. The visual shift from white (wave) to green (NoticeBar) creates a jarring moment. The visitor's eye has to re-adjust.

2. **NoticeBar → Quick Search:** The NoticeBar's green gradient transitions to the Quick Search section's neutral background. This is a smoother transition, but the NoticeBar adds 36px of visual noise between the Hero and the search functionality.

### Does anything interrupt momentum?

**Yes — two things:**

1. **NoticeBar:** The green gradient bar interrupts the white-to-neutral transition. It's visually competing with the Hero's green gradient. The visitor may not realize it's a separate element.

2. **AchievementBadges (Section 3):** The stats grid shows the same data as the Hero trust message. This redundancy slows the visitor down — they have to process the same information twice.

---

## Conversion Score: 82/100

### Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Hero comprehension (3 seconds) | 9/10 | Clear badge, headline, feature strip |
| CTA clarity | 9/10 | "ফ্রি শুরু করুন" is prominent and action-oriented |
| Trust signals | 8/10 | Trust message is good, but stats grid is redundant |
| Product discovery | 8/10 | Feature strip covers core types, but model test is less prominent |
| Flow continuity | 7/10 | NoticeBar gradient competes with Hero, stats grid is redundant |
| Mobile experience | 8/10 | Feature strip scrolls well, CTAs are full-width |
| Return visitor experience | 8/10 | Header search is accessible, but Hero is ignored |

### Why Not Higher

1. **Stats grid in Hero is redundant** — the trust message already provides the same data. The stats grid adds visual weight but no new information. It should be removed.

2. **NoticeBar gradient competes with Hero** — both use green gradients. The transition is jarring. The NoticeBar should either use a different color or be visually separated from the Hero.

3. **AchievementBadges (Section 3) duplicates Hero trust message** — same data, different format. This redundancy should be addressed in a future homepage audit (not in this Hero-focused PR).

---

## Minimum Changes Required

### Change 1: Remove Stats Grid from Hero

**What:** Remove the 4-stat grid (lines 301–323 in HeroSection.tsx).

**Why:** The trust message ("১০,০০০+ শিক্ষার্থী · ৫০,০০০+ MCQ · ৮০% কনটেন্ট বিনামূল্যে") already provides the same information. The stats grid is visual redundancy that adds height without conversion value.

**Impact:** Hero becomes shorter, CTA moves closer to the fold, cleaner visual hierarchy.

**Estimated improvement:** +3-5 points on conversion score.

### Change 2: No Other Changes Needed

The NoticeBar gradient issue is minor and can be addressed in a future visual polish pass. The AchievementBadges duplication is a homepage-level issue, not a Hero issue.

---

*This audit identifies 1 change that improves the Hero conversion score from 82 to ~87. The remaining gaps are homepage-level issues outside the Hero scope.*
