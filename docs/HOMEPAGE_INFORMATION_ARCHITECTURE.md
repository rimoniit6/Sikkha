# Homepage Information Architecture — Sikkha (শিক্ষা বাংলা)

> **Role:** Product Architect / Information Architect
> **Scope:** Information hierarchy only — no visual design, no code, no component suggestions
> **Constraint:** First-time visitor, 5-second decision window
> **Output:** Ideal homepage information flow from entry to footer

---

## Part 1: Analysis of Current Information Architecture

### Current Section Inventory (17 sections, in order)

| # | Section | Information Type | Conversion Role |
|---|---------|-----------------|-----------------|
| 1 | HeroSection | Value proposition + CTA + Stats | Gateway |
| 2 | AchievementBadgesSection | Statistics (6 badges) | Trust |
| 3 | QuickSearchSection | Search tool | Navigation |
| 4 | SubjectExplorerSection | Class/subject browser | Navigation |
| 5 | RecentContentSection | Latest MCQ items | Content preview |
| 6 | NoticeBoardSection | Announcements | Informational |
| 7 | WhyChooseUsSection | Feature comparison | Trust |
| 8 | FeaturedCourses | Curated content | Content preview |
| 9 | EnhancedStatsSection | Statistics (5 counters) | Trust |
| 10 | ExamCountdownSection | Exam timers | Urgency |
| 11 | BoardQuestionSection | Board question quick-start | Navigation |
| 12 | PremiumBanner | Premium upsell | Revenue |
| 13 | TeacherModeratorsSection | Teacher directory | Trust |
| 14 | StudentShowcaseSection | Testimonials | Trust |
| 15 | FAQSection | Common questions | Objection handling |
| 16 | NewsletterSection | Contact form | Lead capture |
| 17 | CTASection | Registration CTA | Conversion |

---

## Part 2: Answers to Core Questions

### 1. What information must appear first?

The visitor's **first question** is: "Is this for me?"

The first information must answer three sub-questions simultaneously:
- **Who is this for?** (Class 6–HSC students)
- **What does it do?** (Helps prepare for board exams)
- **Why should I care?** (80% free, organized, proven)

Nothing else matters until these three questions are answered. If any of them is unclear, the visitor leaves.

The current Hero answers "who" vaguely ("Bangladesh's best platform") but fails on "what" (feature list instead of outcome) and "why" (no differentiator, no proof).

### 2. What information must appear second?

The visitor's **second question** is: "Can I see it working?"

After understanding what the platform is, the visitor needs **evidence** that it actually delivers. This can be:
- A content preview (sample MCQ, board question, lecture thumbnail)
- Social proof (student count, testimonial snippet)
- A trust signal (teacher credentials, success stories)

The current homepage shows statistics second (AchievementBadges), which is **data, not evidence**. Numbers without context are not convincing. "১০,০০০+ শিক্ষার্থী" means nothing if the visitor doesn't know what those students achieved.

### 3. What information should never be inside the Hero?

The Hero has exactly **one job**: get the visitor to take the next step. Everything in the Hero that doesn't serve that job is noise.

**Never in the Hero:**
- **Statistics** — Stats are evidence, not propositions. They belong below, after the visitor understands what the platform is.
- **Multiple CTAs** — Two CTAs create decision paralysis. One primary action only.
- **Feature lists** — "Lectures, MCQ, CQ, board questions" is an inventory, not a promise.
- **Decorative elements** — Particles, floating icons, parallax. These are visual noise that delays comprehension.
- **Premium upsell** — The visitor hasn't seen value yet. Asking for money (or even attention to paid features) is premature.
- **Search bar** — Search is a tool for visitors who already know what they want. The Hero's job is for visitors who DON'T know yet.

**The Hero should contain exactly:**
- One headline (the promise)
- One subtitle (the differentiator)
- One CTA (the next step)
- One trust signal (social proof or credibility marker)

### 4. What information belongs below the fold?

Below the fold is for visitors who decided to stay but need more information before acting. The information hierarchy below the fold follows the visitor's evolving questions:

**Question 3: "How do I get started?"**
→ Navigation tools: Search, class selection, subject browser

**Question 4: "Is this actually good?"**
→ Evidence: Content preview, board question sample, featured content

**Question 5: "Do others trust this?"**
→ Social proof: Testimonials, teacher directory, student count

**Question 6: "What's in it for me specifically?"**
→ Personalization: Class-specific content, exam countdown, premium benefits

**Question 7: "What if I have concerns?"**
→ Objection handling: FAQ, refund policy, contact

**Question 8: "What should I do now?"**
→ Final CTA: Registration, start learning

### 5. Which existing homepage sections should be removed?

| Section | Removal Reason |
|---------|---------------|
| **AchievementBadgesSection** | Statistics are already in the Hero (and EnhancedStats). This section is pure redundancy. It contains the same data points in a different visual format. Remove entirely. |
| **EnhancedStatsSection** | Same data as Hero stats and AchievementBadges. Three statistics sections is information dilution. Remove entirely. |
| **RecentContentSection** | Shows raw MCQ question text to unauthenticated visitors. This is not compelling content — it's a database dump. Raw question text without context (no class label, no subject, no explanation visible) creates confusion, not interest. Move to a dedicated /browse page. |
| **NewsletterSection** | This is a contact form, not a newsletter. A contact form on a homepage serves the business, not the user. The visitor doesn't want to "contact us" — they want to learn. Move to a dedicated /contact page or replace with a lead magnet. |
| **SpecialNoticePopup** | Modal popups that auto-open after 1.2 seconds are hostile information architecture. They interrupt the visitor's scanning pattern and create immediate friction. The information (banners) is already available in HeroNoticeBar. Remove entirely. |

**Net reduction: 17 sections → 12 sections.**

### 6. Which sections should be merged?

| Merge | Into | Rationale |
|-------|------|-----------|
| **WhyChooseUsSection** + **TeacherModeratorsSection** | New: "Why Sikkha" section | Both serve the same psychological function: trust building. "Why choose us" provides logical reasons; teachers provide human proof. Merge into a single section: logical reasons + teacher faces. This halves the trust-building real estate. |
| **StudentShowcaseSection** + (testimonial data from Hero) | New: "Proof" section | Testimonials are currently in section 14 (too late). A condensed version should appear early (after the fold) as a single testimonial snippet, with the full showcase below. Not a separate section — integrated into the trust-building flow. |
| **ExamCountdownSection** + **BoardQuestionSection** | New: "Exam Preparation" section | Both serve the same user intent: exam readiness. Countdown creates urgency; board questions provide the tool. Merge into one section: "Your next exam is in X days — start practicing board questions." |

**Net reduction: 12 sections → 9 sections (after removals and merges).**

### 7. Which sections should move higher?

| Section | Current Position | New Position | Rationale |
|---------|-----------------|--------------|-----------|
| **QuickSearchSection** | 3 | 2 (immediately after Hero) | Search is the highest-intent action. Visitors who know what they want should find the search bar immediately. Current position (after AchievementBadges) delays this. |
| **SubjectExplorerSection** | 4 | 3 | Class/subject selection is the primary navigation mechanism. It should follow search immediately. |
| **ExamCountdownSection** | 10 | 4 (after merge with BoardQuestionSection) | Urgency is a conversion driver. Currently buried at position 10 — most visitors never see it. |
| **StudentShowcaseSection** | 14 | 5 | Social proof should appear before the visitor is asked to take action. Currently, testimonials are the 14th section — 85% of visitors never reach them. |

### 8. Which sections should move lower?

| Section | Current Position | New Position | Rationale |
|---------|-----------------|--------------|-----------|
| **FeaturedCourses** | 8 | 7 | Featured content is important but not conversion-critical. It's a "nice to have" that supports exploration, not a decision driver. |
| **PremiumBanner** | 12 | 8 | Premium should appear AFTER the visitor has seen free value and social proof. Currently it's before testimonials — asking for money before building trust. |
| **FAQSection** | 15 | 9 | FAQ handles objections but shouldn't interrupt the conversion flow. It belongs near the bottom, after the visitor has decided to explore. |

### 9. Which sections are duplicated?

| Duplicate Set | Sections | Problem |
|--------------|----------|---------|
| **Statistics** | HeroSection (4 stats) + AchievementBadgesSection (6 stats) + EnhancedStatsSection (5 stats) | The same data (students, MCQs, lectures, exams) appears three times in different formats. This is not reinforcement — it's noise. The visitor sees "১০,০০০+ শিক্ষার্থী" three times and each time it loses credibility. |
| **Testimonials** | StudentShowcaseSection + (testimonial data potentially in other sections) | Testimonials appear only once currently, but the data exists. If testimonials were shown in the Hero as a snippet AND in a dedicated section, that would be strategic repetition (not duplication). Currently, they're only in section 14 — too late. |
| **CTAs** | HeroSection (2 CTAs) + CTASection (2 CTAs) + PremiumBanner (1 CTA) + ExamCountdownSection (2 CTAs) + BoardQuestionSection (2 CTAs) = 9 CTAs total | Five different sections each have their own CTAs pointing to different destinations. The visitor encounters a new CTA every 2-3 scrolls. This creates decision fatigue, not conversion. |
| **Navigation** | QuickSearchSection + SubjectExplorerSection + BoardQuestionSection | Three different ways to navigate to content. Search is universal; class/subject is hierarchical; board questions is filtered. All three are valid but they compete for the same mental model: "How do I find what I need?" |

### 10. Which sections are unnecessary for conversion?

| Section | Conversion Impact | Verdict |
|---------|-------------------|---------|
| **AchievementBadgesSection** | Zero — same data appears in Hero | Remove |
| **EnhancedStatsSection** | Zero — same data appears in Hero | Remove |
| **RecentContentSection** | Negative — raw MCQ text confuses rather than converts | Remove or move to /browse |
| **NoticeBoardSection** | Neutral — informational, not conversion-driving | Move to header link or /notices page |
| **NewsletterSection** | Negative — contact form is not a conversion tool for students | Remove or move to /contact |
| **FAQSection** | Low — handles objections but doesn't drive action | Keep but move to bottom |
| **CTASection** | Low — redundant with Hero CTA | Remove — the Hero CTA is sufficient |

---

## Part 3: The Ideal Homepage Information Flow

### User Psychology Model

A first-time visitor's mental journey has 6 stages:

| Stage | Internal Question | Time Budget | Required Information |
|-------|-------------------|-------------|---------------------|
| 1. Recognition | "Is this for me?" | 0-2 seconds | Who it's for, what it does |
| 2. Comprehension | "What exactly is this?" | 2-5 seconds | The promise, the differentiator |
| 3. Credibility | "Can I trust this?" | 5-15 seconds | Social proof, evidence |
| 4. Exploration | "How do I use it?" | 15-30 seconds | Navigation, content preview |
| 5. Evaluation | "Is this worth my time?" | 30-60 seconds | Features, testimonials, exam relevance |
| 6. Decision | "Should I start?" | 60+ seconds | Final CTA, objection handling |

Each homepage section should map to exactly ONE stage. Sections that don't map to any stage are noise.

---

### Complete Homepage Structure

#### HEADER (persistent)
**Navigation:** Logo | Classes | Exam Center | Suggestions | Board Questions | Notices | Premium | Login
**Search:** Accessible from header at all times
**Mobile:** Bottom nav with 5 items

---

#### SECTION 1: Hero — Recognition + Comprehension
**Purpose:** Answer "Is this for me?" and "What is this?" in under 3 seconds.

**Information contained:**
- Headline: The student's outcome (not the platform's claim)
- Subtitle: One sentence explaining what the platform offers
- Primary CTA: Single action (one button, one destination)
- Trust signal: One line with student count + free content percentage

**Target user psychology:** The visitor is scanning, not reading. They need to instantly recognize "this is for a student like me" and understand "this helps me prepare for my board exam." If either fails in 2 seconds, they leave.

**Why it belongs here:** This is the first thing the visitor sees. Every millisecond of confusion is a lost visitor. The Hero must do one thing perfectly: get the visitor to the next step.

**Expected conversion impact:** CRITICAL. This is the gate. If the Hero fails, nothing below matters. A clear Hero can improve click-through to the next section by 30-50%.

**Contains:** Headline + Subtitle + 1 CTA + 1 trust line
**Does NOT contain:** Stats, multiple CTAs, search, features, premium, decorations

---

#### SECTION 2: Quick Search — Exploration (for high-intent visitors)
**Purpose:** Immediately serve visitors who already know what they want.

**Information contained:**
- Search input with placeholder text
- Popular search tags (5-6 trending topics)
- Category shortcuts (Board Questions, MCQ, Lectures)

**Target user psychology:** Some visitors arrive with specific intent ("I need SSC Math MCQ"). These are the highest-conversion visitors. If they can't find the search bar in 3 seconds, they bounce. The search bar must be immediately accessible.

**Why it belongs here:** After the Hero answers "what is this?", the very next question for an engaged visitor is "how do I find what I need?" Search is the fastest path to content.

**Expected conversion impact:** HIGH. Search users convert 2-3x higher than browse users. Making search prominent captures this high-intent segment immediately.

---

#### SECTION 3: Subject Explorer — Exploration (for browse-mode visitors)
**Purpose:** Serve visitors who don't know exactly what they want but know their class.

**Information contained:**
- Class selection tabs (Class 6, 7, 8, SSC, HSC)
- Subject cards for the selected class (6 subjects max)
- "See all subjects" link

**Target user psychology:** The majority of visitors are in browse mode. They know their class but not the specific content they need. Class selection is the most natural filtering mechanism for Bangladeshi students (everything is organized by class in the physical education system).

**Why it belongs here:** This follows the natural information architecture: Hero (what) → Search (find) → Browse (explore). Visitors who don't search will browse. The class→subject hierarchy is the platform's primary navigation model.

**Expected conversion impact:** MEDIUM-HIGH. This section drives the deepest engagement. Visitors who select a class and explore subjects are 4-5x more likely to register than visitors who only scroll.

---

#### SECTION 4: Exam Preparation — Urgency + Navigation
**Purpose:** Create time-bound motivation and provide the fastest path to exam practice.

**Information contained:**
- Next board exam countdown (days remaining)
- Board question quick-start (class selection → immediate practice)
- Board/year/subject stats (total questions, boards covered)

**Target user psychology:** Bangladeshi students are deadline-driven. Board exams are the single most important event in their academic life. Showing "১৮০ দিন বাকি" creates urgency that no other content can match. Urgency converts procrastination into action.

**Why it belongs here:** After the visitor has explored (Sections 2-3), they need a reason to act NOW rather than later. The exam countdown provides that reason. Board questions provide the tool.

**Expected conversion impact:** HIGH. Urgency is the #1 conversion driver in EdTech. Students who see an exam countdown are significantly more likely to start practicing immediately.

---

#### SECTION 5: Trust Building — Credibility
**Purpose:** Answer "Can I trust this?" with both logical and emotional evidence.

**Information contained:**
- "Why Sikkha" (3-4 key reasons, not 6 — quality over quantity)
- 1-2 teacher profiles (name, institution, subject)
- 1-2 student testimonials (name, class, outcome)
- Platform statistics (condensed: student count + question count + free content %)

**Target user psychology:** The visitor has seen what the platform offers (Sections 1-4). Now they need proof that it's legitimate. Trust has two components: logical (stats, features) and emotional (real people, real stories). Both must be present.

**Why it belongs here:** Trust building should happen BEFORE the visitor is asked to take a significant action (register, explore premium). Placing trust signals after the action request (current position: section 14) is backwards — you don't ask someone to commit before proving you're worth committing to.

**Expected conversion impact:** HIGH. Testimonials and teacher profiles are the strongest trust signals. Moving them from section 14 to section 5 puts them in front of 3-4x more visitors.

---

#### SECTION 6: Featured Content — Evidence
**Purpose:** Show, don't tell. Let the visitor see actual content quality.

**Information contained:**
- 4-6 featured content items (mix of lectures, MCQ, CQ, board questions)
- Content type labels (MCQ, Lecture, Board Question)
- Free/premium indicators
- Class/subject context for each item

**Target user psychology:** After trusting the platform (Section 5), the visitor wants to see what the content actually looks like. Featured content serves as a "try before you buy" mechanism. The visitor can evaluate quality without committing.

**Why it belongs here:** Evidence should follow trust. The visitor trusts the platform (Section 5) and now wants to verify that the content matches the promise. Featured content provides that verification.

**Expected conversion impact:** MEDIUM. Featured content doesn't directly drive registration, but it increases time-on-site and content exploration, which are leading indicators of conversion.

---

#### SECTION 7: Premium — Revenue
**Purpose:** Monetize engaged visitors who have seen enough free value to consider paying.

**Information contained:**
- Premium value proposition (what you get)
- Pricing tiers (individual content vs. bundles)
- Feature comparison (free vs. premium)
- CTA to browse premium content

**Target user psychology:** The visitor has now seen the Hero (what), explored content (how), felt urgency (when), built trust (who), and verified quality (evidence). Only NOW is the visitor psychologically ready to consider payment. Premium before this point is premature.

**Why it belongs here:** Revenue sections should always follow value demonstration. The current position (section 12, before testimonials at section 14) asks for money before building full trust. Moving premium to section 7 means the visitor has already invested significant attention.

**Expected conversion impact:** MEDIUM. Premium conversion depends on free value demonstration. By section 7, the visitor has seen enough to make an informed decision.

---

#### SECTION 8: Social Proof (Full) — Reinforcement
**Purpose:** Provide deep social proof for visitors who need more convincing.

**Information contained:**
- Full testimonial carousel (3-5 testimonials)
- Student success stories
- Rating/review aggregate (if available)

**Target user psychology:** Some visitors need multiple touchpoints before acting. The single testimonial in Section 5 may not be enough. The full testimonial showcase provides depth for visitors who are still evaluating.

**Why it belongs here:** Full testimonials are a "closing" technique. They reinforce the decision after the visitor has seen everything else. Placing them before the final CTA creates a "everyone else is doing it" momentum.

**Expected conversion impact:** MEDIUM. Testimonials have diminishing returns — the first one has the most impact (Section 5), subsequent ones provide reinforcement.

---

#### SECTION 9: FAQ — Objection Handling
**Purpose:** Address remaining concerns before the final CTA.

**Information contained:**
- 5-7 most common questions
- Answers that reduce friction (payment safety, refund policy, content quality)

**Target user psychology:** The visitor is almost ready to act but has lingering doubts. FAQ addresses these doubts without requiring human intervention. Each answered question removes one barrier to conversion.

**Why it belongs here:** FAQ is a "last mile" tool. It handles the objections that remain after trust, evidence, and social proof have been presented. Placing FAQ earlier interrupts the conversion flow.

**Expected conversion impact:** LOW-MEDIUM. FAQ doesn't drive conversion directly, but it removes barriers. Each question answered is one less reason to bounce.

---

#### FOOTER
**Information contained:**
- Site links (Classes, Board Questions, Premium, Contact)
- Legal pages (Privacy, Terms)
- Social media links
- Copyright notice

---

## Part 4: Section-by-Section Justification

### Why Quick Search is Section 2 (not Section 3)

Search is the highest-intent action on the page. A visitor who searches is telling you exactly what they want. Every second between the Hero and the search bar is a second where a high-intent visitor might bounce.

The current position (Section 3, after AchievementBadges) delays search by one full section. AchievementBadges contains statistics that the visitor has already seen in the Hero (Section 1). This delay costs high-intent visitors.

**Information architecture principle:** Highest-intent tools should be closest to the entry point.

### Why Exam Preparation is Section 4 (not Section 10)

The current position (Section 10) means approximately 70-80% of visitors never see the exam countdown. For an EdTech platform targeting exam students, this is a critical conversion failure.

Urgency is time-sensitive. The visitor's sense of urgency is highest immediately after landing (they just thought about their exam). Delaying the urgency signal by 9 sections dilutes its impact.

**Information architecture principle:** Time-sensitive information should be as close to the entry point as possible.

### Why Trust Building is Section 5 (not Section 14)

The current position (testimonials at Section 14, "Why Choose Us" at Section 7) means trust signals appear AFTER the visitor has already been asked to take action (CTAs in Sections 1, 10, 11, 12).

This is backwards. You don't ask someone to commit before proving you're trustworthy. Trust should precede action requests.

**Information architecture principle:** Trust signals should precede action requests, not follow them.

### Why Premium is Section 7 (not Section 12)

Premium placement hasn't changed much (12 → 7), but the context has. In the current layout, premium appears after Featured Courses but before Testimonials. In the new layout, premium appears after Featured Content and before full Testimonials.

The key difference: in the new layout, the visitor has already seen:
- The promise (Hero)
- The content (Search + Subject Explorer)
- The urgency (Exam Preparation)
- The trust (Why Sikkha + teachers)
- The evidence (Featured Content)

Only after all five does the visitor see the premium pitch. This is the correct psychological sequence.

**Information architecture principle:** Monetization should follow value demonstration.

### Why Statistics Appear Only Once (in Trust Building)

The current homepage shows statistics three times:
1. HeroSection: 4 stats
2. AchievementBadgesSection: 6 stats
3. EnhancedStatsSection: 5 stats

This is not strategic repetition — it's information dilution. When the same data appears three times, each instance loses credibility. The visitor thinks "they're trying too hard to convince me."

Statistics should appear once, in context, with meaning. "১০,০০০+ শিক্ষার্থী" is more powerful when it appears alongside a teacher's name or a student's success story than when it appears alone in a grid.

**Information architecture principle:** Each piece of information should appear once, in the context where it has maximum impact.

### Why the Contact Form is Removed from the Homepage

The current NewsletterSection is a contact form (name, email, message). This serves the business (customer support) but not the user (learning).

A first-time visitor doesn't want to "contact us" — they want to learn. The contact form is a dead end: it doesn't lead to content, doesn't build trust, doesn't create urgency. It's a self-service tool for the business masquerading as a homepage section.

Contact information belongs in the footer or a dedicated /contact page. The homepage should be entirely user-focused.

**Information architecture principle:** Homepage sections should serve the user's goal, not the business's goal.

---

## Part 5: Conversion Funnel Mapping

| Funnel Stage | Homepage Section | User Action | Conversion Metric |
|-------------|-----------------|-------------|-------------------|
| **Awareness** | Hero (Section 1) | Read headline, understand promise | Bounce rate reduction |
| **Interest** | Quick Search (Section 2) | Type a query or click a tag | Search initiation rate |
| **Interest** | Subject Explorer (Section 3) | Select a class, view subjects | Class selection rate |
| **Desire** | Exam Preparation (Section 4) | View countdown, click "Start" | Exam practice initiation |
| **Trust** | Trust Building (Section 5) | Read testimonials, view teachers | Time on page increase |
| **Evaluation** | Featured Content (Section 6) | Click a content item | Content click-through rate |
| **Consideration** | Premium (Section 7) | View pricing, click "See bundles" | Premium page visit rate |
| **Reinforcement** | Full Testimonials (Section 8) | Read success stories | Scroll depth increase |
| **Conversion** | FAQ (Section 9) | Address remaining objections | Registration rate |

---

## Part 6: If I Could Keep Only 3 Sections

### The 3 sections that would maximize conversion:

**Section 1: Hero — Recognition + Comprehension**
- This is non-negotiable. Without a clear Hero, the visitor doesn't know what the platform is. Every conversion starts here.
- **Impact:** Without Hero, bounce rate approaches 100%.

**Section 4: Exam Preparation (merged countdown + board questions)**
- This is the highest-conversion section. It combines urgency (countdown) with action (board question practice). It answers "Why should I act NOW?" and "What should I do?"
- **Impact:** This section directly drives the platform's core use case: exam preparation.

**Section 5: Trust Building (merged Why Sikkah + teachers + testimonials)**
- This is the trust section. Without it, the visitor has no reason to believe the platform is legitimate. It combines logical reasons (Why Sikkha) with human proof (teachers + testimonials).
- **Impact:** Without trust, the visitor won't take any action regardless of how compelling the Hero or Exam sections are.

### Why these 3 and not others?

| Considered | Why not? |
|-----------|----------|
| Quick Search | Important but not conversion-critical for first-time visitors. Search is for returning users who know what they want. |
| Subject Explorer | Important for engagement but not for the initial conversion. The visitor can explore after registering. |
| Featured Content | Evidence is important but not as critical as trust. A visitor will trust testimonials before they evaluate content quality. |
| Premium | Revenue section. Can't convert to premium without first converting to free user. Not a first-3-section priority. |
| FAQ | Objection handling. Only relevant if the visitor is already considering action. Not a first-3-section priority. |

### The 3-Section Conversion Model:

```
HERO (Is this for me?) → EXAM PREP (Why now?) → TRUST (Can I believe this?)
         ↓                       ↓                        ↓
    "Yes, this is          "My exam is              "Others like me
     for me"               coming up"               trust this"
         ↓                       ↓                        ↓
         └───────────────→ REGISTER / START ←──────────────┘
```

These three sections answer the three questions every visitor asks:
1. "What is this?" (Hero)
2. "Why should I care?" (Exam Preparation)
3. "Can I trust this?" (Trust Building)

Everything else is secondary. These three are the minimum viable homepage.

---

## Part 7: Information Architecture Principles Applied

| Principle | Application |
|-----------|-------------|
| **One section = one job** | Each section answers exactly one question in the visitor's mental model. No section serves double duty. |
| **Highest intent closest to entry** | Search (Section 2) is immediately after the Hero because it serves the highest-intent visitors. |
| **Trust before action** | Trust signals (Section 5) appear before any significant action request (register, explore premium). |
| **Urgency is time-sensitive** | Exam countdown (Section 4) appears early because urgency decays over time. |
| **Evidence follows trust** | Featured content (Section 6) appears after trust (Section 5) because evidence is only compelling if the source is trusted. |
| **Revenue follows value** | Premium (Section 7) appears after the visitor has seen free value, trust, and evidence. |
| **Objection handling is last** | FAQ (Section 9) appears at the end because it addresses remaining doubts after the visitor has seen everything else. |
| **No duplication** | Statistics appear once. CTAs are unified. Testimonials are split strategically (one early, full showcase later). |
| **User goal > business goal** | The contact form is removed because it serves the business, not the user. Every section must serve the visitor's goal. |

---

*This document describes information architecture only. Visual implementation (layout, typography, colors, spacing, animations) is a separate concern and should be designed after the information hierarchy is validated.*
