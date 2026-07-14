# শিক্ষা বাংলা (Sikkha) - Online Learning Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A Bangladeshi online learning platform serving students from Class 6 to HSC, built with Next.js 16, React 19, and TypeScript 5.9.

---

## Architecture

The application follows a **SPA-in-SSR** pattern -- a single `page.tsx` entry point with client-side rendering, powered by a custom Zustand-based router with URL synchronization via `RouteSync`.

```
Request --> proxy.ts --> App Router page.tsx --> Client App
               |
          JWT auth check,
          CSRF protection,
          security headers,
          role-based access
```

- **Proxy** (`src/proxy.ts`): The central request handler -- JWT-based authentication from HttpOnly cookies, CSRF token validation on mutations, security headers (CSP, HSTS, X-Frame-Options), role-based API access, and injects user context (`x-user-id`, `x-user-role`) into API requests.
- **Route Groups**: Organised as `(main)` for public pages and `(auth)` for authenticated pages (handled via `[...slug]` catch-all route).
- **No SSR pages**: All pages render client-side. Dynamic imports load components on demand.
- **Admin Route Protection**: Proxy-level session verification + role query from DB, plus `withAdmin()` guard with rate limiting on write operations.

### Layout Hierarchy

```
RootLayout (html, body, fonts, metadata)
  ThemeProvider (next-themes)
    QueryProvider (TanStack React Query, dehydrated state)
      AuthProvider (JWT session)
        LoadingProvider (route transition loader)
          RouteSync (URL state sync)
          AppNavigationBridge (SPA navigation bridge)
          DynamicFavicon (admin detection)
          ApiErrorHandler (global error boundary)
          GlobalStructuredData (JSON-LD)
          {children} (page content)
          Toaster (Sonner toast notifications)
```

## Project Structure

```
src/
  app/                           # Next.js App Router pages and API routes
    [...slug]/                   # Catch-all SPA page entry
    admin/                       # Admin panel (30+ route groups)
    api/                         # 80+ REST API endpoints
    board-questions/             # Board question browsing pages
    classes/                     # Class listing page
    courses/                     # Course pages
    cq/                          # Creative question pages
    dashboard/                   # User dashboard
    exams/                       # Custom exam pages
    knowledge-questions/         # Knowledge/comprehension questions
    lecture/                     # Lecture viewer
    login/                       # Authentication pages
    mcq/                         # MCQ practice pages
    notices/                     # Notice board
    payment/                     # Payment pages
    premium/                     # Premium content access
    search/                      # Global search
    suggestions/                 # Exam suggestions
    globals.css                  # Tailwind CSS v4 entry
    layout.tsx                   # Root layout (providers, fonts, SEO)
    page.tsx                     # Home page
    sitemap.ts                   # Dynamic sitemap generation
    error.tsx                    # Route error boundary
    global-error.tsx             # Root error boundary (layout-level)
    loading.tsx                  # Route loading state
    not-found.tsx                # 404 page
  components/                    # React components by domain
    admin/                       # Admin panel page components (30+)
    auth/                        # Login, register, password reset
    classes/                     # Class/subject/chapter pages
    cq/                          # Creative question components
    exam/                        # Exam system (builder, viewer, results)
    home/                        # Homepage sections (hero, featured, notices)
    layout/                      # AppShell, Header, Footer, BottomNav
    lecture/                     # Lecture viewer, content rendering
    mcq/                         # MCQ practice, exam, results
    notice/                      # Notice board
    payment/                     # Payment forms, history, paywall
    premium/                     # Premium lock/paywall
    search/                      # Global search UI
    shared/                      # RouteSync, AppNavigationBridge, JSON-LD
    suggestion/                  # Suggestion components
    ui/                          # shadcn/ui primitives + ImageUploader, SafeImage
  constants/                     # Application constants
  context/                       # React context utilities
  features/                      # Domain-driven feature modules
    course/                      # Course system (admin + student)
    cq-exam/                     # CQ exam packages (admin, grading, answers)
    mcq-exam/                    # MCQ exam packages (admin)
  hooks/                         # 40+ custom React hooks
  instrumentation.ts             # Sentry instrumentation
  lib/                           # Utilities and services
    __tests__/                   # Unit tests
    db.ts                        # Prisma client singleton
    auth.ts                      # Auth utilities (requireAuth, requireAdmin)
    auth/jwt.ts                  # JWT token signing/verification (jose)
    api-utils.ts                 # API helpers (withAdmin, withCsrf, pagination)
    api-route-handler.ts         # Factory for standardized API route handlers
    errors.ts                    # Error class hierarchy + safe transaction wrapper
    rate-limit.ts                # Rate limiter
    csrf.ts                      # CSRF token generation/validation
    sanitize.ts                  # DOMPurify HTML sanitization
    query-keys.ts                # TanStack Query key factory
    fetch-json.ts                # HTTP client with retries
    cache-headers.ts             # Cache header presets
    validations.ts               # Zod validation schemas
    ...                          # 40+ modules total
  middleware.ts                  # Next.js middleware (optional, used for CSP nonce)
  proxy.ts                       # Request proxy (JWT auth, CSRF, security headers, route guard)
  providers/                     # React context providers
    AuthProvider.tsx             # JWT session context
    QueryProvider.tsx           # TanStack Query + dehydration
    LoadingProvider.tsx          # Route loading state
  services/                      # Business logic layer
    api/                         # HTTP client service
    server/                      # Server-side services (access control, purchase)
  store/                         # Zustand stores
    auth.ts                      # Authentication state
    router.ts                    # Custom client-side router (50+ routes)
    exam.ts                      # Exam state
    analytics.ts                 # Admin analytics state
    board-filters.ts             # Board question filters
    chapter-filters.ts           # Chapter filters
  types/                         # TypeScript type definitions
  utils/                         # Standalone utility functions
```

## Getting Started

### Prerequisites

- **Node.js** 20+ (v22 recommended)
- **npm** (package manager)
- **SQLite** (included, no external database server needed)

### Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Key environment variables:

| Variable                    | Description                                             |
|-----------------------------|---------------------------------------------------------|
| `DATABASE_URL`              | SQLite connection string (`file:./dev.db`)              |
| `CSRF_SECRET`               | 32+ character secret for CSRF token signing             |
| `JWT_SECRET`                | 32+ character secret for JWT token signing              |
| `SENTRY_DSN`                | Sentry DSN for error monitoring (optional)              |
| `NEXT_PUBLIC_SENTRY_DSN`    | Public Sentry DSN for client errors (optional)          |
| `NEXT_PUBLIC_SITE_URL`      | Public-facing site URL                                  |
| `FEATURE_UPLOAD`            | Enable file upload feature (`true`/`false`)             |
| `FEATURE_FORGOT_PASSWORD`   | Enable forgot password flow (`true`/`false`)            |
| `SUPER_ADMIN_EMAIL`         | Default super admin email for seeding                   |
| `SUPER_ADMIN_PASSWORD`      | Default super admin password for seeding                |

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema to SQLite
npm run db:push

# Seed the database
npx prisma db seed

# Create a super admin user (CLI only)
npm run create-super-admin

# Start development server (Turbopack on port 3000)
npm run dev
```

## Available Scripts

| Script                          | Description                                        |
|---------------------------------|----------------------------------------------------|
| `npm run dev`                   | Start dev server with Turbopack on port 3000       |
| `npm run build`                 | Production build with standalone output            |
| `npm run analyze`               | Build with bundle analyzer (ANALYZE=true)          |
| `npm run start`                 | Start production server                            |
| `npm test`                      | Run all tests (Vitest)                             |
| `npm run test:watch`            | Run tests in watch mode                            |
| `npm run lint`                  | Run ESLint                                         |
| `npm run db:push`               | Push Prisma schema to SQLite                       |
| `npm run db:generate`           | Generate Prisma client                             |
| `npm run db:migrate`            | Run Prisma migrations                              |
| `npm run db:reset`              | Reset database and re-run migrations               |
| `npm run create-super-admin`    | Create super admin user (CLI)                      |
| `npm run list-super-admins`     | List all super admin users                         |
| `npm run revoke-super-admin`    | Revoke super admin role from a user                |
| `npm run seed:content`          | Seed content data                                   |
| `npm run seed:missing`          | Seed missing content references                     |

## Security

- **Authentication**: Custom JWT-based auth with HttpOnly cookies (via `jose`), 7-day token expiry, HS256 signing
- **CSRF Protection**: JWT-based tokens signed with `CSRF_SECRET`, enforced by `proxy.ts` on all non-auth mutation routes. Header (`x-csrf-token`) or JSON body (`_csrf`) validation
- **Content Sanitization**: DOMPurify (`isomorphic-dompurify`) strips scripts and event handlers from HTML content at the database middleware layer (`db.ts` Prisma extension)
- **Rate Limiting**: Rate limiter applied to auth, API, upload, and admin mutation endpoints
- **Security Headers**: CSP (with nonce), HSTS (max-age=31536000, preload), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy, X-XSS-Protection -- set in `next.config.ts` and `proxy.ts`
- **Access Control**: Role-based (STUDENT, ADMIN, SUPER_ADMIN) with granular permission system (`Permission` + `RolePermission` models). Premium content stripped at API level
- **Payment Race Conditions**: DB unique constraints (`[userId, contentType, contentId, status]`) + Prisma P2002 error handling + client-side idempotency keys
- **Error Boundaries**: `global-error.tsx` catches layout-level crashes with Sentry reporting

## Performance Optimizations

- **Image Optimization**: AVIF/WebP formats, device sizes [480..1536], 1-day minimum cache TTL
- **Font Optimization**: Geist variable fonts with `display: swap`
- **Code Splitting**: Route-level dynamic imports, package imports optimization for `lucide-react`, `recharts`, `framer-motion`, Radix UI
- **Caching**: TanStack React Query with dehydrated server state, cache headers for static assets (1-year immutable for images/fonts, 1-hour for JSON), CDN-friendly
- **Database**: Batch query patterns, composite indexes on all major query paths, HTML sanitization at Prisma middleware layer (avoids per-request sanitization)
- **State Management**: Zustand stores with selector patterns to prevent unnecessary re-renders

## Database

SQLite via Prisma ORM (v7). Schema spans 1500+ lines across 45+ models.

### Schema Overview

| Domain                | Models                                                                  |
|-----------------------|-------------------------------------------------------------------------|
| **User System**       | `User`, `Permission`, `RolePermission`                                  |
| **Content Structure** | `ClassCategory`, `Subject`, `Chapter`, `Topic`, `ContentType`           |
| **Lectures**          | `Lecture`, `Resource`                                                   |
| **MCQ**               | `MCQ` (with image support per option)                                   |
| **CQ**                | `CQ` (4 sub-questions per stem, all with image support)                 |
| **Knowledge**         | `KnowledgeQuestion` (knowledge + comprehension types)                   |
| **Board Questions**   | `Board`, `ExamYear`, `BoardYear`                                        |
| **Exams**             | `Exam`, `ExamQuestion`, `ExamResult`                                    |
| **MCQ Exam Packages** | `MCQExamPackage`, `MCQExamSet`, `MCQExamSetQuestion`, `MCQExamSetResult`|
| **CQ Exam Packages**  | `CQExamPackage`, `CQExamSet`, `CQExamSetQuestion`, `CQExamSubmission`   |
|                       | `CQExamAnswer`, `CQExamAnswerImage` (with annotation support)           |
| **Exam Retake**       | `MCQExamRetakeRequest`, `CQExamRetakeRequest`                           |
| **Courses**           | `Course`, `CourseLesson`, `LessonNote`, `LessonResource`, `LessonExam`  |
|                       | `LessonAssignment`, `AssignmentSubmission`, `LessonSchedule`            |
|                       | `CourseExamSchedule`, `LessonProgress`, `CourseEnrollment`              |
|                       | `CoursePurchase`                                                        |
| **Bundles**           | `ContentBundle`, `BundleItem`                                           |
| **Subscriptions**     | `ContentPackage`, `UserSubscription`, `MCQExamPackagePurchase`          |
|                       | `CQExamPackagePurchase`                                                 |
| **Payment**           | `Payment` (idempotency keys, admin notes, review workflow)              |
| **CMS**               | `Banner`, `Notice`, `FAQ`, `Testimonial`, `Suggestion`, `SiteSetting`   |
|                       | `Navigation`, `FeaturedContent`, `TeacherModerator`                     |
| **User Activity**     | `Bookmark`, `Progress`, `Note`, `RecentlyViewed`, `UserFeedback`        |
|                       | `FeedbackMessage`, `Notification`                                       |
| **Audit**             | `AuditLog` (action, entity, before/after state)                         |
| **Analytics**         | `AnalyticsEvent`, `AnalyticsSession`, `AnalyticsSearchQuery`            |
|                       | `AnalyticsAlert`, `AnalyticsReport`                                     |

### Database Features

- HTML sanitization middleware at the Prisma client layer (sanitizes content models on write)
- Transaction retry logic via `safeTransaction()` (handles P2034 deadlock retries)
- Batch query patterns with composite indexes on all paginated/filtered query paths
- `AuditLog` captures `oldData`/`newData` JSON for admin action history
- Payment system uses composite unique constraints + idempotency keys for race condition prevention

## Design Patterns

- **Singleton Prisma Client**: Global instance cached on `globalThis` in development
- **Error Class Hierarchy**: `AppError` base class with `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `PaymentError`, `DatabaseError` -- all with Bengali error messages
- **Standardized API Response Format**: Every endpoint returns `{ success: boolean, data?, error?, code?, pagination? }` via `apiResponse()` / `apiError()` helpers
- **Factory-Based Route Handlers**: `createRouteHandler()` centralises auth, CSRF, rate limiting, validation, caching, and error handling into a single declarative config
- **Query Key Factory Pattern**: All TanStack Query keys defined in `query-keys.ts` for type-safe cache invalidation
- **Store Selector Pattern**: Zustand stores with fine-grained selectors to minimise re-renders

## API Overview

80+ REST API endpoints organised as:

- **Auth** (7): login, register, logout, profile, password management
- **Content** (25+): classes, subjects, chapters, lectures, MCQ, CQ, bundles, packages, suggestions, courses, board questions, search, navigation
- **Exam Packages** (25+): MCQ exam sets (create, submit, grade, retake), CQ exam sets (submit answers, upload images, grade, bulk grade, annotated images)
- **Payment** (7): create, verify, check access, batch check, purchase history, accounts
- **Admin** (35+): full CRUD for all content types, featured content, hierarchy, user management, payment review, CMS, settings, database tools (all write endpoints rate-limited)
- **Courses** (5+): course CRUD, lessons, enrollments, purchases, progress
- **Analytics** (10+): revenue, students, retention, conversion, drop-off, realtime, insights, predictions, alerts, reports
- **User** (2): dashboard, payment history

## Testing

Unit tests powered by Vitest:

| Test File                  | Tests | Coverage                                |
|----------------------------|-------|----------------------------------------|
| `api-client.test.ts`       | 46    | HTTP client, retries, error handling   |
| `errors.test.ts`           | 36    | Error classes, formatting, logging     |
| `access-control.test.ts`   | 31    | Content access chain, class detection  |
| `auth.test.ts`             | 20    | Auth utilities, token handling         |
| `purchase.service.test.ts` | 10    | Payment, subscription, purchase lookup |
| `validations.test.ts`      | 8     | Input validation schemas               |
| `error-history.test.ts`    | 7     | Error history tracking                 |
| `safe-transaction.test.ts` | 5     | DB transaction safety                  |

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
```

## Deployment

```bash
# Build with standalone output
STANDALONE_OUTPUT=true npm run build

# Start production server
npm run start
```

Sentry error tracking is configured for client, server, and edge runtimes (optional).

## Technologies

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS v4 + `tw-animate-css` + Radix UI primitives (50+ components)
- **State Management**: Zustand 5 + TanStack React Query 5
- **Database**: SQLite via Prisma 7 ORM
- **Auth**: Custom JWT (jose) with HttpOnly cookies
- **Validation**: Zod 4
- **Rich Text**: TipTap (heading, bold, italic, link, underline, lists)
- **Math Rendering**: KaTeX + MathJax 3 (MathML fallback)
- **Mind Maps**: Markmap (interactive SVG mind maps)
- **Animation**: Framer Motion 12
- **Charts**: Recharts
- **Tables**: TanStack React Table
- **Carousel**: Embla Carousel with autoplay
- **UI Components**: Sonner (toasts), Vaul (drawer), Cmdk (command palette), Input OTP, react-day-picker, react-resizable-panels
- **Content Security**: DOMPurify (isomorphic-dompurify)
- **Excel Processing**: xlsx (bulk import/export)
- **Theming**: next-themes (light/dark/system)
- **Error Monitoring**: Sentry (client + server + edge)
- **CSRF Protection**: JWT-based (jose)
- **Testing**: Vitest with coverage

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC
