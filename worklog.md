---
Task ID: 1
Agent: Main Agent
Task: Clone and run the rimoniit6/Sikkha GitHub repository

Work Log:
- Cloned https://github.com/rimoniit6/Sikkha to /home/z/Sikkha
- Analyzed project structure: Next.js 16 educational platform (Bengali) with Prisma/SQLite, JWT auth, MCQ/CQ exams, courses, payments, analytics, admin dashboard
- Copied all project files into /home/z/my-project (the active Next.js project directory)
- Created .env with SQLite database URL, JWT/CSRF secrets, and feature flags
- Installed all dependencies with bun (949 packages)
- Generated Prisma client and pushed schema to SQLite database
- Ran comprehensive seed script (seed-all.ts) populating: super admin, students, classes, subjects, chapters, boards, exam years, lectures, MCQs, CQs, banners, FAQs, testimonials, packages, teachers, notices, navigation, permissions, etc.
- Fixed critical Prisma 7 adapter issue: PrismaLibSql in v7 is a factory class (not an adapter wrapper). Changed from `new PrismaLibSql(preCreatedClient)` to `new PrismaLibSql({ url: dbUrl })` pattern
- Disabled Sentry (no DSN configured) by simplifying next.config.ts and stubbing instrumentation.ts
- Fixed database path resolution: replaced fileURLToPath/import.meta.url with process.cwd() for Turbopack compatibility
- Verified the homepage renders correctly in browser with full content: hero section, stats, class categories, board questions, premium section, teachers, testimonials, FAQ, footer
- Created 15-minute cron job (ID: 265680) for webDevReview

Stage Summary:
- Sikkha (শিক্ষা বাংলা) educational platform is fully running at port 3000
- Database seeded with comprehensive test data
- Homepage verified rendering correctly with all Bengali content
- Key fix: Prisma 7 adapter pattern change (factory vs wrapper)
- Cron job configured for continuous development review every 15 minutes

---
Task ID: 2
Agent: Main Agent
Task: Project assessment and current state

## Current Project Status Description/Assessment
- **Project**: শিক্ষা বাংলা (Sikkha) - Bangladesh's largest online education platform
- **Framework**: Next.js 16.1.3 with Turbopack, React 19, TypeScript 5.9, Tailwind CSS 4, Prisma 7.8 (SQLite/libsql)
- **Status**: Running successfully, homepage renders with full content
- **Database**: SQLite with comprehensive seed data (users, classes, subjects, chapters, MCQs, CQs, etc.)

## Current Goals / Completed Modifications / Verification Results
- ✅ Repo cloned and set up in /home/z/my-project
- ✅ Dependencies installed (949 packages)
- ✅ Database initialized and seeded with full test data
- ✅ Critical Prisma 7 adapter bug fixed (PrismaLibSql factory pattern)
- ✅ Sentry disabled for local dev (no DSN available)
- ✅ next.config.ts simplified (removed Sentry wrapper and CSP headers that could block resources)
- ✅ Homepage verified: renders Bengali educational content with all sections (hero, stats, classes, board questions, premium, teachers, testimonials, FAQ, footer)
- ✅ 15-minute webDevReview cron job created (ID: 265680)

## Unresolved Issues or Risks, and Priority Recommendations
1. **Dev server persistence**: The background dev server process dies between Bash tool invocations. The server must be started fresh in each Bash session. Consider using a mini-service wrapper.
2. **Stats show zero**: Homepage stats (students, MCQs, lectures, exams) display "০" (zero). The /api/stats endpoint may need investigation - stats might not be counting seeded data correctly.
3. **External service dependencies disabled**: UploadThing (file uploads), Upstash Redis (rate limiting), Supabase (optional) are installed but not functional. Feature flags control this (FEATURE_UPLOAD=false).
4. **No Google Fonts in sandbox**: The layout imports Geist fonts from next/font/google which may fail in sandboxed environments. Consider fallback fonts.
5. **MathJax CDN dependency**: The layout loads MathJax from cdn.jsdelivr.net for LaTeX rendering. This external dependency requires internet access.
6. **Priority for next phase**: Fix the stats display, ensure server persistence, improve mobile responsiveness, and add missing interactive features.

---
Task ID: 3
Agent: Main Agent + Subagents
Task: Bug fixes, styling improvements, and new features

## Current Project Status Description/Assessment
- **Project**: শিক্ষা বাংলা - fully running with all bugs fixed and new features added
- **All homepage sections verified working** in agent-browser QA

## Bugs Fixed (3 critical bugs)
1. **Stats showing zero** (use-metadata.ts): `usePublicStats`, `useFAQs`, `useTestimonials`, `useTeacherModerators` hooks used `fetchJSON` which returned raw `{success, data}` envelope. Updated all hooks to properly unwrap `res.data` / `res.data.faqs` / etc.
2. **Classes API DATABASE_ERROR** (api/classes/route.ts): Raw SQL used PostgreSQL-specific syntax (`COUNT(*) FILTER (WHERE ...)` and `::bigint` casts). Rewrote queries to use SQLite-compatible `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` syntax and boolean `= 1` instead of `= true`.
3. **FAQ/Testimonials/Teachers "Loading..." forever** (use-metadata.ts): Same root cause as bug 1 - hooks didn't unwrap the nested API response. Fixed data extraction logic.
4. **RecentContentSection crash** (`mcqs.map is not a function`): API returns `data.questions` not `data.mcqs`. Added `data.questions` to extraction logic. Also updated McqItem interface to handle `text` field (API uses `text` not `question`).
5. **StatsSection AnimatedCounter showing ০**: IntersectionObserver was unreliable in automated browser. Made counter immediately display the value, with animation as progressive enhancement.

## Styling Improvements Added
1. **"কেন আমরা সেরা" (Why Choose Us) section**: 6 feature cards in responsive 2x3 grid with gradient icons, hover animations, card-glow effect, staggered bounce-in animation
2. **CTA Section**: Full-width emerald gradient section with decorative floating circles, "নিবন্ধন করুন" and "আরও জানুন" buttons
3. **New CSS animations**: `bounce-in-up`, `blink`, `text-shimmer`, `card-glow` pseudo-element hover effect
4. **Scroll Progress indicator**: Thin emerald gradient bar at top of viewport tracking scroll position

## New Features Added
1. **Recent Content Section**: Fetches latest MCQs from API, displays in horizontal scroll (mobile) / grid (desktop) with subject/chapter info, truncated question text, board/year badges, and view buttons
2. **Scroll Progress Bar**: Fixed position progress indicator using requestAnimationFrame for performance
3. **Why Choose Us Section**: 6 features (Quality Content, Mobile Friendly, Model Tests, Doubt Solving, Payment Security, 24/7 Access) with animated cards

## Files Created
- `/src/components/home/WhyChooseUsSection.tsx`
- `/src/components/home/CTASection.tsx`
- `/src/components/home/ScrollProgress.tsx`
- `/src/components/home/RecentContentSection.tsx`

## Files Modified
- `/src/hooks/use-metadata.ts` (bug fixes for 4 hooks)
- `/src/app/api/classes/route.ts` (SQLite-compatible SQL)
- `/src/components/home/StatsSection.tsx` (AnimatedCounter fix)
- `/src/components/home/RecentContentSection.tsx` (data extraction + interface fix)
- `/src/components/home/HomePage.tsx` (added 4 new sections)
- `/src/app/globals.css` (new animations)
- `/src/lib/db.ts` (Prisma 7 adapter factory pattern)
- `/src/instrumentation.ts` (Sentry stub)
- `/next.config.ts` (simplified)

## Verification Results (agent-browser)
✅ Hero section: "৩+", "২৫+", "৯২+" stats in Bengali numerals
✅ Class categories: ৫ classes with content counts
✅ Recent content: MCQ cards with board/year badges
✅ Why Choose Us: ৬ feature cards visible
✅ Stats section: Correct Bengali numerals displayed
✅ Board questions section: Interactive with class filter
✅ Premium section: With pricing "১৯৯ থেকে"
✅ Teachers section: ৪ teacher cards with details
✅ Testimonials: Carousel with 3 reviews, navigation working
✅ FAQ: 5 accordion items, expandable
✅ CTA section: "আজই শুরু করুন আপনার শিক্ষা যাত্রা"
✅ Footer: Links, classes, contact info
✅ No errors in dev log

## Unresolved Issues or Risks, and Priority Recommendations
1. **Dev server persistence** (existing): Server dies between Bash tool invocations
2. ~~**Board Questions section**: Shows "কোনো শ্রেণি পাওয়া যায়নি"~~ — FIXED: useBoardQuestionFilters hook now unwraps { success, data } envelope. Also seeded 270 MCQs with board/year data across all 5 classes.
3. ~~**Footer "দ্রুত লিংক" links**: Empty list items~~ — FIXED: Footer now shows fallback text when no nav items, with proper styling
4. **Featured Courses section**: Not visible - requires featured content seed data in database
5. **Mobile responsiveness**: Need real device testing
6. **Priority next**: Add featured content seed data, test login/registration, add more CQ board questions

---
Task ID: 4
Agent: Main Agent + Subagents (5 parallel)
Task: Styling improvements, new features, and bug fixes (Round 2)

## Current Project Status Description/Assessment
- **Project**: শিক্ষা বাংলা (Sikkha) - fully running with enhanced homepage
- **Homepage now has 17 sections** (up from 13): all previously working sections plus 5 new sections and enhanced hero/footer
- All new components pass lint with no errors
- Dev server compiles and serves correctly

## Completed Modifications

### Bug Fixes
1. **Board Questions "কোনো শ্রেণি পাওয়া যায়নি"** — `useBoardQuestionFilters` hook in `use-home-data.ts` wasn't unwrapping the `{ success, data }` API response envelope. Fixed by checking for `res.data` before accessing fields.
2. **Board Questions seed data** — Added 270 MCQs with board/year/classLevel data across all 5 classes (class-6 through HSC), 3 boards (dhaka, rajshahi, chittagong), 3 years (2022-2024). Previously only SSC had board data.

### New Features (5 new sections)
1. **AchievementBadgesSection** — Trust indicators row showing 8 badges: students count, MCQ count, boards, chapters, teachers, free access, secure payment, mobile friendly. Uses live stats from `usePublicStats`. Horizontally scrollable on mobile, flex-wrap on desktop. Glassmorphism pills with gradient icon circles.
2. **QuickSearchSection** — Full-featured search bar with debounced auto-suggestions (fetches from `/api/search/suggestions`), keyboard navigation (ArrowUp/Down/Enter/Escape), popular search tags, glass-morphism card design, gradient border on focus.
3. **SubjectExplorerSection** — Interactive class-tab + subject-grid browser. Users select a class (class-6 through HSC) and see subject cards with chapter counts, keyword-mapped icons (গণিত→Calculator, বিজ্ঞান→Atom, etc.), and navigate to subject detail pages.
4. **NoticeBoardSection** — CSS marquee ticker for pinned notices, responsive grid of notice cards with type-based icons/colors (announcement/emerald, exam/amber, general/sky, urgent/rose), pinned badge, loading/empty/error states.
5. **NewsletterSection** — Contact form section with dark emerald gradient, glass-morphism card, name/email/message inputs, Bengali validation, success state with animated checkmark, toast notification, decorative floating blobs.

### Styling Improvements
1. **Hero Section** — Enhanced with:
   - Canvas-based particle system (60 particles with connection lines between nearby particles)
   - Multi-layer gradient backgrounds (3 radial gradients)
   - 8 floating icons (up from 5)
   - Pulse ring animation on the top badge
   - Animated text shimmer on "শিক্ষা প্ল্যাটফর্ম"
   - Underline glow effect below the title
   - Stats cards now have icons (Users, BookOpen, Play, Award), hover lift effect, and icon color change on hover
   - Enhanced CTA buttons with scale animations and shadow transitions
   - Double-layer bottom wave

2. **Footer** — Complete redesign:
   - Gradient top border accent line
   - Brand section now has English subtitle "Education Platform"
   - Social icons now have colored hover states (Facebook→blue, YouTube→red, Telegram→sky) with lift animation
   - Column headers have colored accent bars (emerald, amber, rose)
   - Quick links and class links now have animated dot indicators on hover
   - Contact info items have icon containers with hover background transition
   - "ভালোবাসায় তৈরি" heart now pulses softly
   - Scroll-to-top button with smooth show/hide animation

3. **CSS Additions** — New utility classes:
   - `animate-marquee` / `animate-marquee:hover` — CSS-only horizontal ticker
   - `.text-gradient-gold` — Gold gradient text effect
   - `.animate-smooth-count` — Counter entrance animation
   - `.input-glass-focus` — Glass morphism focus ring for inputs
   - `.animate-badge-pulse` — Subtle badge scale pulse

### Files Created
- `/src/components/home/AchievementBadgesSection.tsx`
- `/src/components/home/QuickSearchSection.tsx`
- `/src/components/home/SubjectExplorerSection.tsx`
- `/src/components/home/NoticeBoardSection.tsx`
- `/src/components/home/NewsletterSection.tsx`

### Files Modified
- `/src/components/home/HomePage.tsx` — Added 5 new section imports and rendering order
- `/src/components/home/HeroSection.tsx` — Complete rewrite with particle canvas, enhanced visuals
- `/src/components/layout/Footer.tsx` — Complete redesign with better visual hierarchy
- `/src/hooks/use-home-data.ts` — Fixed `useBoardQuestionFilters` data unwrapping
- `/src/app/globals.css` — Added marquee, gradient-text, smooth-count, glass-focus, badge-pulse utilities

### Verification Results
- Lint passes for all new components (0 errors, only pre-existing warnings)
- Dev server compiles successfully
- Board questions API now returns data for all 5 classes

## Unresolved Issues or Risks, and Priority Recommendations
1. **Featured Courses section**: Still hidden — needs featured content records in the database
2. **Dev server persistence**: Server dies between Bash tool invocations (existing, non-critical)
3. **CQ board questions**: Only MCQs were seeded with board data; CQ seeding failed due to schema requirements
4. **Search suggestions API**: The QuickSearchSection fetches from `/api/search/suggestions` — need to verify this endpoint works
5. **Notice data**: The NoticeBoardSection depends on notices being seeded — verify `/api/notices` returns data
6. **Priority next**: Seed featured content, seed CQ board questions, test all new sections in browser, add more interactive features (exam countdown, download app banner)