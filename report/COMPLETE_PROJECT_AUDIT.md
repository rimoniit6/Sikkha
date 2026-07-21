# Sikkha - Complete Project Audit Report

**Project:** Sikkha (শিক্ষা বাংলা) - Online Learning Platform  
**Stack:** Next.js 16 App Router / TypeScript / Prisma ORM / SQLite (libSQL) / React 19 / TailwindCSS 4 / Zustand 5 / React Query 5  
**Audit Date:** 2026-07-21  
**Auditor:** Senior Staff Software Engineer / Architect / QA Lead / Security Engineer / Production Readiness Auditor  

---

## PART 1: PROJECT INVENTORY

### 1. Folder Structure

```
Sikkhs/
├── prisma/              (schema + 6 seed files + migrations)
├── public/              (9 static assets + uploads/)
├── scripts/             (19 utility/migration scripts)
├── src/
│   ├── app/             (Next.js App Router pages + API)
│   │   ├── admin/       (38 admin page routes)
│   │   ├── api/         (50 API route directories → 196 route.ts files)
│   │   ├── [..]/        (32 top-level page directories)
│   ├── components/      (27 component directories → 339 TSX files)
│   ├── context/         (1: LoadingContext)
│   ├── contexts/        (1: AdminAlertContext)
│   ├── features/        (5 feature modules)
│   ├── hooks/           (26 hook directories/files → 55 hooks)
│   ├── lib/             (70 utility modules)
│   ├── providers/       (4 global providers)
│   ├── services/        (31 API services + 2 server services)
│   ├── store/           (7 Zustand stores)
│   ├── types/           (7 type definition files)
│   └── utils/           (1 utility file)
├── tests/               (test directory)
├── docs/                (documentation)
└── .claude/             (skills configuration)
```

### 2. Total Files

| Category | Count |
|----------|-------|
| **Total source files (src/)** | **940** |
| TypeScript config files | 5 |
| Prisma schema + seeds | 7 |
| Scripts | 19 |
| Configuration files | 8 |
| Test files | 21 |
| **Total project files (est.)** | **~1,010** |

### 3. Total API Routes

| Category | Count |
|----------|-------|
| Admin API routes | 97 |
| Public API routes | 68 |
| Auth API routes | 4 |
| User API routes | 8 |
| Student API routes | 1 |
| Payment API routes | 7 |
| Course API routes | 6 |
| Exam API routes | 10 |
| **Total API route files** | **196** |

### 4. Total Pages

| Category | Count |
|----------|-------|
| Admin pages | 37 |
| Public pages | 31 |
| **Total page.tsx files** | **78** |

### 5. Total Components

| Category | Count |
|----------|-------|
| UI components (shadcn) | ~30 |
| Admin components | ~80 |
| Home page components | ~25 |
| Feature components | ~120 |
| Shared components | ~30 |
| Loading components | ~5 |
| Auth components | ~3 |
| Analytics components | ~25 |
| **Total TSX components** | **339** |

### 6. Total Hooks

| Category | Count |
|----------|-------|
| Admin hooks | 28 |
| Student hooks | 1 |
| User hooks | 1 |
| General hooks | 25 |
| **Total hooks** | **55** |

### 7. Total Prisma Models

| # | Model Name | Table Purpose |
|---|-----------|---------------|
| 1 | User | User accounts |
| 2 | ClassCategory | Class levels (6-12, SSC, HSC) |
| 3 | Subject | Academic subjects |
| 4 | Chapter | Chapters within subjects |
| 5 | Topic | Topics within chapters |
| 6 | KnowledgeQuestion | Knowledge/comprehension Q&A |
| 7 | Lecture | Lecture content |
| 8 | Resource | Lecture attachments |
| 9 | MCQ | Multiple choice questions |
| 10 | CQ | Creative/essay questions |
| 11 | Exam | Custom exam builder |
| 12 | ExamQuestion | Exam-question junction |
| 13 | ExamResult | Exam results |
| 14 | ExamSession | Active exam sessions |
| 15 | Progress | User content progress |
| 16 | Bookmark | Content bookmarks |
| 17 | Note | User notes |
| 18 | UserFeedback | Feedback threads |
| 19 | FeedbackMessage | Feedback messages |
| 20 | RecentlyViewed | Browsing history |
| 21 | Payment | Payment records |
| 22 | Notification | In-app notifications |
| 23 | AuditLog | Audit trail |
| 24 | ContentVersion | Version history |
| 25 | Banner | Homepage banners |
| 26 | FAQ | Frequently asked questions |
| 27 | Testimonial | User testimonials |
| 28 | Notice | Announcements |
| 29 | Suggestion | Study suggestions |
| 30 | Board | Education boards |
| 31 | ExamYear | Exam years |
| 32 | BoardYear | Board-year combinations |
| 33 | ContentType | Content type definitions |
| 34 | FeaturedContent | Featured content |
| 35 | SiteSetting | Site settings |
| 36 | ContactMessage | Contact form messages |
| 37 | Navigation | Navigation menu items |
| 38 | ContentBundle | Content bundles |
| 39 | BundleItem | Bundle item junction |
| 40 | ContentPackage | Time-based packages |
| 41 | UserSubscription | Active subscriptions |
| 42 | MCQExamPackage | MCQ exam packages |
| 43 | MCQExamSet | MCQ exam sets |
| 44 | MCQExamSetQuestion | MCQ set-question junction |
| 45 | MCQExamSetResult | MCQ exam results |
| 46 | MCQExamRetakeRequest | MCQ retake requests |
| 47 | MCQExamPackagePurchase | MCQ package purchases |
| 48 | CQExamPackage | CQ exam packages |
| 49 | CQExamSet | CQ exam sets |
| 50 | CQExamSetQuestion | CQ set-question junction |
| 51 | CQExamPackagePurchase | CQ package purchases |
| 52 | CQExamSubmission | CQ exam submissions |
| 53 | CQExamAnswer | CQ answers |
| 54 | CQExamAnswerImage | CQ answer images |
| 55 | CQExamRetakeRequest | CQ retake requests |
| 56 | Permission | RBAC permissions |
| 57 | RolePermission | Role-permission junction |
| 58 | TeacherModerator | Teachers/moderators |
| 59 | Course | Course definitions |
| 60 | CourseLesson | Course lessons |
| 61 | LessonNote | Lesson notes |
| 62 | LessonResource | Lesson resources |
| 63 | CourseExamSchedule | Course exam schedules |
| 64 | LessonExam | Lesson-exam junction (deprecated) |
| 65 | LessonAssignment | Lesson assignments |
| 66 | AssignmentSubmission | Assignment submissions |
| 67 | LessonSchedule | Lesson schedules |
| 68 | LessonProgress | Lesson progress |
| 69 | CourseEnrollment | Course enrollments |
| 70 | Certificate | Course certificates |
| 71 | CoursePurchase | Course purchases |
| 72 | AnalyticsEvent | Analytics events |
| 73 | AnalyticsSession | Analytics sessions |
| 74 | AnalyticsSearchQuery | Search analytics |
| 75 | AnalyticsAlert | Analytics alerts |
| 76 | AnalyticsReport | Analytics reports |
| 77 | ContentWorkflow | Editorial workflow |
| 78 | WorkflowHistory | Workflow state history |
| 79 | WorkflowComment | Workflow comments |

### 8. Total Database Tables: **79**

### 9. Admin Features

- Dashboard with analytics overview
- User management (CRUD, ban/unban, role changes)
- Content hierarchy management (Class → Subject → Chapter → Topic)
- Lecture management (CRUD, rich text editor)
- MCQ management (CRUD, bulk upload)
- CQ management (CRUD)
- Knowledge questions management
- Exam management (custom exam builder)
- MCQ exam package management
- CQ exam package management (with image-based answers)
- Exam results & grading
- MCQ exam purchases management
- Content purchases overview
- Payment management (approve/reject with audit)
- Subscription management
- Course management (CRUD, lessons, assignments)
- Bundle management
- Package management
- Banner management
- Notice management
- FAQ management
- Testimonial management
- Featured content management
- Teacher/moderator management
- Navigation management
- Content type management
- Board & year management
- Content settings (SEO, homepage)
- Notification management
- Feedback management
- Contact messages
- Analytics suite (15+ dashboards)
- Audit logs (view, verify, export, retention)
- Version history (view, rollback)
- Editorial workflow (submit, review, approve, reject, publish, schedule)
- Trash management (soft delete, restore, force delete, auto-cleanup)
- Bulk import (MCQ, CQ)
- Database export/import
- RBAC permission management
- CMS settings (site config, rate limits, CSRF)

### 10. User Features

- Registration / Login
- User dashboard
- Profile editing
- Learning preference selection (Class-based / Global)
- Content browsing (Class → Subject → Chapter → Content)
- Lecture viewer (rich text, video, audio, PDF)
- MCQ practice
- CQ practice
- Knowledge questions
- Board questions
- Search (full-text)
- Bookmarks
- Notes
- Progress tracking
- Recently viewed
- Notification center
- Feedback/support
- Custom exam builder
- Exam history
- Payment submission
- Content purchase
- Course enrollment
- Course learning (lessons, assignments, schedules)
- Certificate generation

### 11. Premium Features

- Per-content pricing (MCQ, CQ, lectures, suggestions, exams)
- Content bundles
- Time-based packages (30-day, 6-month, 1-year subscriptions)
- MCQ exam packages (scheduled sets)
- CQ exam packages (with image-based submissions)
- Course purchases
- Subscription-based access checking

### 12. Payment Features

- Manual payment submission (bKash, Nagad, Rocket)
- Payment screenshot upload
- Idempotency keys for duplicate prevention
- Admin payment review (approve/reject)
- Payment cross-check (per-content, bundle, subscription)
- Payment access checking API
- Payment batch check
- Payment history (user & admin)
- Payment statistics
- Audit logging for all payment actions

### 13. Authentication Features

- JWT-based session (HS256, 7-day expiry)
- Cookie-based session (`httpOnly`, `secure`, `sameSite: lax`)
- Registration with email validation
- Password hashing (bcryptjs)
- Auth middleware (proxy.ts)
- Session cookie management
- Super admin auto-seeding

### 14. Authorization System

- Three-tier RBAC: SUPER_ADMIN → ADMIN → STUDENT
- Database-backed permission system (Permission + RolePermission models)
- Permission caching (60s TTL)
- Role-based middleware guards
- Route-level authorization (admin pages require ADMIN/SUPER_ADMIN)
- API-level authorization (requireAuth, requireAdmin, requireSuperAdmin, requirePermission)
- Header-based user context (x-user-id, x-user-role) — documented as logging-only, not for auth

### 15. Background Jobs

- Scheduled publish (Vercel cron: `/api/admin/cron/publish-scheduled`, every 1 min)
- Audit log purge (`/api/admin/cron/purge-audit-logs`)
- Trash auto-cleanup (configurable retention, 90-day default)

### 16. Cron Jobs

| Cron | Schedule | Endpoint |
|------|----------|----------|
| Scheduled publish | `*/1 * * * *` | `/api/admin/cron/publish-scheduled` |
| Audit log purge | Configured via cron | `/api/admin/cron/purge-audit-logs` |

### 17. Scheduled Tasks

- Content auto-publishing (workflow engine)
- Trash retention cleanup (configurable)
- Audit log retention purge

### 18. Upload Features

- UploadThing integration (file uploads)
- Local upload support
- Screenshot upload (payment verification)
- Image uploads for MCQ/CQ options
- PDF attachments
- Video URL support (external)
- Audio URL support (external)

### 19. Notification Features

- In-app notifications (database-persisted)
- Broadcast notifications (all students)
- Notification types: INFO, SUCCESS, WARNING, ERROR
- Read/unread tracking
- Mark all as read
- Workflow state change notifications
- Email notification abstraction (best-effort, provider-based)

### 20. Search Features

- Full-text search API
- Search suggestions
- Board question search with suggestions
- Search analytics tracking
- Filtered search (by class, subject, content type)

### 21. Cache Layers

| Layer | Mechanism | TTL |
|-------|-----------|-----|
| React Query dehydrated state | Server-side prefetch | 5 min (staleTime) |
| Site config | React Query | 5 min |
| CSRF setting | In-memory cache | 30s |
| Rate limit config | In-memory cache | 5 min |
| Permission cache | In-memory cache | 60s |
| Rate limit counters | In-memory Map | Per-window |
| API cache headers | HTTP Cache-Control | 30s–1d (tiered) |
| Image optimization | Next.js Image | 86400s min TTL |

### 22. Security Layers

| Layer | Implementation |
|-------|---------------|
| JWT Authentication | HS256, 7-day expiry, httpOnly cookies |
| CSRF Protection | JWT-based tokens, configurable via admin settings, always-on in production |
| Rate Limiting | Sliding window (API: 60/min, Upload: 10/min, Auth: 10/15min) |
| HTML Sanitization | DOMPurify (isomorphic), centralized in sanitize.ts |
| Input Validation | Zod schemas for all API inputs |
| Security Headers | CSP (with nonce), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, etc. |
| Audit Logging | Immutable (append-only enforced at DB layer), SHA-256 tamper detection |
| RBAC | Three-tier role system with database-backed permissions |
| Soft Delete | 29+ models with soft delete, cascade rules, parent hierarchy validation |
| Content Sanitization | Auto-sanitization on write (Prisma middleware) |
| Request ID | Unique per-request tracing |
| Password Hashing | bcryptjs |

### 23. Logging Layers

| Layer | Mechanism |
|-------|-----------|
| Structured Logger | Custom logger with levels (debug/info/warn/error/fatal) |
| Request Logger | Automatic API request logging with duration |
| Sentry Integration | Error/fatal auto-capture with replay |
| Audit Log | Database-persisted, immutable, hash-verified |
| Process Handlers | Unhandled rejection/exception handlers |

### 24. Audit System

- **175+ audit action types** covering every admin and user operation
- **45+ entity types** for granular tracking
- Immutable records (DB-layer enforcement: update/delete blocked)
- SHA-256 hash for tamper detection
- PII sanitization for sensitive data
- User agent parsing (OS, browser)
- Session ID and request ID correlation
- Duration tracking
- Batch audit logging (for bulk operations)
- Audit log retention with configurable purge
- Audit log verification API
- Bengali action/entity labels for UI display

### 25. Middleware / Proxy

- **Proxy (proxy.ts)**: Central middleware handling:
  - Static asset passthrough with security headers
  - Public page route authentication bypass
  - Public API route authentication bypass
  - JWT cookie verification for protected routes
  - CSRF validation for mutating API requests (configurable)
  - Admin route role checking
  - Security header injection (CSP with nonce, X-Request-ID)
  - Login redirect for unauthenticated users

### 26. Global Providers

| Provider | Purpose |
|----------|---------|
| QueryProvider | React Query client with dehydrated state |
| AuthProvider | Authentication state management |
| LearningPreferenceProvider | User learning mode context |
| LoadingProvider | Global loading state |
| ThemeProvider | next-themes light/dark mode |

### 27. Context Providers

| Context | Purpose |
|---------|---------|
| LoadingContext | Loading state for page transitions |
| AdminAlertContext | Admin alert/dialog management |

### 28. Zustand Stores

| Store | Purpose |
|-------|---------|
| auth.ts | User authentication state (persisted to localStorage) |
| analytics.ts | Analytics dashboard state |
| board-filters.ts | Board question filter state |
| chapter-filters.ts | Chapter filter state |
| exam.ts | Exam state management |
| navigation-loader.ts | Navigation loading state |
| router.ts | Client-side routing state |

### 29. React Query Usage

- Server-side prefetching (site config in layout.tsx)
- 55+ custom hooks using React Query
- Dehydrated state hydration
- Query keys centralized in `query-keys.ts`
- Stale-while-revalidate patterns
- Optimistic updates for mutations

### 30. Utility Libraries

| Module | Purpose |
|--------|---------|
| access-control.ts | RBAC permission checking |
| analytics-cache.ts | Analytics caching |
| api-client.ts | Client-side API wrapper |
| api-utils.ts | Server-side API helpers |
| audit.ts | Audit logging system |
| audit-integrity.ts | SHA-256 hash verification |
| audit-pii.ts | PII sanitization |
| audit-retention.ts | Audit log retention |
| auth.ts | Authentication helpers |
| auth/jwt.ts | JWT sign/verify |
| board-grouping.ts | Board question grouping |
| cache-headers.ts | HTTP cache header presets |
| cache-invalidate.ts | Cache invalidation |
| content-diff.ts | Content change diffing |
| course-access-resolver.ts | Course access checking |
| csrf.ts | CSRF token management |
| date-utils.ts | Date formatting |
| db.ts | Prisma client singleton |
| errors.ts | Error classes + handler |
| excel-parse.ts | Excel file parsing |
| features.ts | Feature flags |
| file-url.ts | File URL resolution |
| loading-manager.ts | Loading state |
| logger.ts | Structured logging |
| math-converter.ts | MathML ↔ LaTeX |
| notification-service.ts | Notification dispatch |
| password.ts | Password hashing |
| premium.ts | Premium derivation logic |
| rate-limit.ts | Rate limiting |
| request-id.ts | Request ID generation |
| request-logger.ts | Request logging middleware |
| sanitize.ts | HTML sanitization |
| scheduled-publish.ts | Auto-publish service |
| seed-super-admin.ts | Super admin seeding |
| seo-settings.ts | SEO configuration |
| soft-delete.ts | Soft delete system |
| suggestion-cache.ts | Suggestion caching |
| trash-cleanup.ts | Trash auto-cleanup |
| upload/ | Upload helpers |
| uploadthing/ | UploadThing integration |
| version-history.ts | Content versioning |
| workflow.ts | Editorial workflow engine |

### 31. Shared Components

- DynamicFavicon
- ApiErrorHandler
- GlobalStructuredData (JSON-LD)
- RouteSync
- AppNavigationBridge
- RouteLoader / RouteLoadingBar

### 32. Feature Modules

| Module | Purpose |
|--------|---------|
| features/common | Shared feature utilities |
| features/course | Course system logic |
| features/cq-exam | CQ exam system logic |
| features/custom-exam | Custom exam builder logic |
| features/mcq-exam | MCQ exam system logic |

### 33. Current Architecture Pattern

**Pattern: Monolithic Full-Stack Next.js with Service Layer**

- **App Router** with server components and API routes
- **Service Layer**: 31 API services + 2 server services for business logic
- **Repository Pattern** via Prisma ORM
- **RBAC** with database-backed permissions
- **Event-driven** audit logging
- **Workflow Engine** for content editorial lifecycle
- **Soft Delete** with cascade rules and parent hierarchy validation

### 34. Dependency Graph Summary

```
Pages → Components → Hooks → Services → Prisma → SQLite
         ↕              ↕
      Providers    Zustand Stores
         ↕
      Contexts
```

### 35. Runtime Dependencies (32)

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^16.1.1 | Framework |
| react / react-dom | ^19.0.0 | UI |
| @prisma/client | ^7.8.0 | ORM |
| @libsql/client | ^0.17.4 | SQLite driver |
| @prisma/adapter-libsql | ^7.8.0 | Prisma adapter |
| zustand | ^5.0.6 | State management |
| @tanstack/react-query | ^5.82.0 | Server state |
| zod | ^4.0.2 | Validation |
| jose | ^6.2.3 | JWT |
| bcryptjs | ^3.0.3 | Password hashing |
| @supabase/ssr + supabase-js | ^0.12.0 / ^2.108.1 | Auth provider |
| @uploadthing/react + uploadthing | ^7.3.3 / ^7.7.4 | File uploads |
| @upstash/ratelimit + redis | ^2.0.8 / ^1.38.0 | Rate limiting |
| @sentry/nextjs | ^10.59.0 | Error tracking |
| isomorphic-dompurify | ^3.15.0 | HTML sanitization |
| @tiptap/* | ^3.27.0 | Rich text editor |
| recharts | ^2.15.4 | Charts |
| framer-motion | ^12.23.2 | Animations |
| lucide-react | ^0.525.0 | Icons |
| xlsx | ^0.18.5 | Excel parsing |
| katex | ^0.16.45 | Math rendering |
| markmap-lib + view | ^0.18.12 | Mind maps |
| date-fns | ^4.4.0 | Date utils |
| next-themes | ^0.4.6 | Theme switching |
| cmdk | ^1.1.1 | Command palette |
| vaul | ^1.1.2 | Drawer component |
| embla-carousel-* | ^8.6.0 | Carousels |
| server-only | ^0.0.1 | Server-only guard |
| tailwind-merge | ^3.3.1 | Tailwind class merging |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Class names |

### 36. Development Dependencies (11)

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.9.3 | Type checking |
| eslint + eslint-config-next | ^9 / ^16.1.1 | Linting |
| vitest + @vitest/coverage-v8 | ^4.1.9 | Testing |
| @next/bundle-analyzer | ^16.2.9 | Bundle analysis |
| tailwindcss | ^4 | CSS framework |
| @tailwindcss/postcss | ^4 | PostCSS plugin |
| lightningcss | ^1.32.0 | CSS optimization |
| tsx | ^4.22.4 | TypeScript execution |
| tw-animate-css | ^1.3.5 | Animation classes |
| @types/node, @types/react, @types/react-dom | Various | Type definitions |

### 37. External Services

| Service | Purpose | Config |
|---------|---------|--------|
| Sentry | Error tracking | Optional DSN |
| UploadThing | File uploads | API key (implicit) |
| Supabase | Auth provider | SSR integration |
| Upstash Redis | Rate limiting (optional) | API key (implicit) |
| Vercel | Deployment + Cron | vercel.json |

### 38. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| DATABASE_URL | Yes | SQLite file path |
| JWT_SECRET | Yes (prod) | JWT signing key |
| CSRF_SECRET | Optional | CSRF token signing |
| ENABLE_CSRF | Optional | CSRF toggle (dev) |
| SUPER_ADMIN_EMAIL | Optional | Auto-created admin |
| SUPER_ADMIN_PASSWORD | Optional | Auto-created admin |
| SUPER_ADMIN_NAME | Optional | Auto-created admin |
| SENTRY_DSN | Optional | Sentry integration |
| NEXT_PUBLIC_SENTRY_DSN | Optional | Sentry client |
| NODE_ENV | Standard | Environment |
| LOG_LEVEL | Optional | Logging verbosity |
| NEXT_PUBLIC_APP_URL | Optional | App URL for links |
| STANDALONE_OUTPUT | Optional | Standalone build |

### 39. Build Configuration

- **Next.js 16** with App Router and Turbopack (dev)
- **TypeScript strict mode** enabled with all strict flags
- **ESLint** with Next.js config
- **PostCSS** with TailwindCSS 4
- **LightningCSS** for CSS optimization
- **Bundle analyzer** available via `npm run analyze`
- **Standalone output** optional via env var
- **Image optimization**: AVIF + WebP, custom device sizes, 24h cache TTL
- **React Strict Mode** enabled
- **Compression** enabled
- **PoweredBy header** disabled

### 40. Deployment Configuration

- **Vercel** deployment (vercel.json with cron jobs)
- **Standalone mode** optional for Docker/self-hosted
- **Caddy** config present (Caddyfile for reverse proxy)
- **Service worker** registered for PWA capabilities

---

## PART 2: AUDIT ANALYSIS

### ✅ Strengths

1. **Exceptional audit system**: 175+ action types, 45+ entity types, immutable append-only records with SHA-256 tamper detection, PII sanitization, and comprehensive Bengali labels. This is enterprise-grade audit infrastructure.

2. **Robust soft delete architecture**: 29+ models with soft delete, cascade rules, parent hierarchy validation, bulk operations with atomic transactions, and configurable auto-cleanup. The `soft-delete.ts` is one of the most comprehensive implementations I've seen.

3. **Editorial workflow engine**: Full DRAFT → IN_REVIEW → APPROVED → SCHEDULED → PUBLISHED lifecycle with optimistic concurrency control, version history, rollback capability, and automated scheduled publishing.

4. **Defense-in-depth security**: JWT auth, CSRF protection (always-on in production), CSP with nonces, rate limiting, HTML sanitization via DOMPurify, input validation via Zod, and security headers. Multiple layers, no single point of failure.

5. **Centralized architecture patterns**: Single source of truth for premium derivation (`premium.ts`), HTML sanitization (`sanitize.ts`), error handling (`errors.ts`), logging (`logger.ts`), and API responses (`api-utils.ts`).

6. **Comprehensive RBAC**: Database-backed permissions with caching, role hierarchy (SUPER_ADMIN → ADMIN → STUDENT), and granular permission checking.

7. **Version history with rollback**: Content changes tracked with snapshots, changed fields, and full rollback capability. Integrated with the workflow engine.

8. **Database-layer protections**: Prisma middleware enforces soft delete filtering, HTML sanitization on write, and AuditLog immutability at the ORM level.

9. **Health/readiness probes**: `/api/health` and `/api/ready` endpoints with database connectivity checks and environment validation.

10. **Comprehensive content hierarchy**: Well-structured Class → Subject → Chapter → Topic hierarchy with proper cascade relationships.

### ⚠ Weak Areas

1. **SQLite in production**: The project uses SQLite (via libSQL) which limits concurrent writes, lacks connection pooling, and doesn't support advanced features like row-level locking. This is the single biggest architectural concern for scaling.

2. **In-memory rate limiting**: Rate limit counters use a `Map` in process memory. In a multi-instance deployment (serverless/Vercel), each instance has its own counter, making rate limits easily bypassable.

3. **In-memory permission cache**: Same issue — permission cache is per-process, not shared. Not a correctness issue but means permission changes take up to 60s to propagate across instances.

4. **No database migrations in CI/CD**: While `prisma migrate dev` scripts exist, there's no visible migration strategy for production deployments.

5. **Test coverage appears minimal**: 21 test files for a 940-file project. Critical paths like API routes, payment flows, and exam submission are largely untested.

6. **Hardcoded dev secrets**: `.env` file contains hardcoded JWT secret and super admin credentials. While documented as dev-only, this is a risk if accidentally deployed.

7. **`any` type usage**: `soft-delete.ts` uses `any` for Prisma client types due to extended client incompatibility. This weakens type safety in a critical module.

8. **No rate limiting on public API routes**: Many content-fetching API routes are in the `PUBLIC_API_ROUTES` list and bypass authentication, but they also bypass rate limiting.

9. **Large bundle risk**: The project has 339 components, recharts, framer-motion, tiptap, katex, markmap, xlsx, and many Radix UI components. Bundle size optimization is critical.

10. **Missing CSP `connect-src` for external APIs**: The CSP allows `connect-src 'self'` which would block any external API calls from the client. If Supabase or other external calls are needed, this needs updating.

### ❌ Critical Risks

1. **SQLite cannot handle concurrent writes**: Under load, write operations will serialize and cause timeouts. For a production learning platform, this is a hard blocker for multi-user concurrent exam submissions, payment processing, and analytics event recording.

2. **No database connection pooling**: SQLite via libSQL doesn't provide connection pooling. Each request opens a new connection, which under load creates file descriptor exhaustion risk.

3. **Hardcoded JWT secret in `.env`**: If this file is committed to git (it appears to be), the JWT secret is compromised. Session forgery becomes trivial.

4. **`.env` file potentially committed**: The `.env` file exists in the project root. If `.gitignore` doesn't properly exclude it, secrets are in version control.

5. **Cron endpoint authentication unclear**: `/api/admin/cron/publish-scheduled` is called by Vercel cron, but the auth mechanism for cron invocations needs verification. If unprotected, anyone can trigger publish operations.

6. **CSRF disabled in development**: While documented, this means development testing never exercises CSRF protection, potentially missing integration issues.

7. **No HTTPS enforcement at application level**: Security headers don't include `Strict-Transport-Security`. HTTPS enforcement relies entirely on the hosting platform.

### 🟡 Technical Debt

1. **`LessonExam` model is deprecated but still in schema** (line 1519+): Marked as "deprecated — kept for backward compat" but still present. Should be removed after data migration.

2. **Permission cache uses global mutable state**: `let permissionCache: Map<string, Set<string>> | null = null` in `auth.ts` — not safe across edge runtimes or isolated contexts.

3. **Inconsistent error handling in middleware**: The proxy catches errors in `getAuthFromCookie` but silently returns `payload` on catch, potentially bypassing DB role verification.

4. **Multiple seed files**: 6 seed files (`seed.ts`, `seed-all.ts`, `seed-comprehensive.ts`, `seed-content.ts`, `seed-db.ts`, `seed-missing.ts`) suggests iterative development without cleanup.

5. **Rate limiter `setInterval` in module scope**: The cleanup interval runs globally and never stops, even in test environments.

6. **`includeDeleted: true` as a custom Prisma extension**: This is a non-standard Prisma pattern that relies on the custom query middleware. It works but creates a hidden API contract.

7. **Mixed Bengali and English in error messages**: API errors are in Bengali (user-facing) but code comments and some internal errors are in English. This is intentional but creates inconsistency in logs.

8. **MathJax loaded via CDN `<Script>` tags**: Third-party scripts loaded via `dangerouslySetInnerHTML` with `lazyOnload` strategy. Could impact Core Web Vitals.

### 🔴 Production Blockers

1. **SQLite write concurrency** — Cannot support concurrent exam submissions or payment processing at scale.

2. **Missing production environment variables** — No visible production `.env` configuration for JWT_SECRET, CSRF_SECRET, DATABASE_URL, or Sentry DSN.

3. **Rate limiting is per-process** — Effectively no rate limiting in serverless/multi-instance deployments.

4. **No database migration strategy** — Schema changes require manual intervention in production.

5. **Test coverage insufficient for production** — 21 test files covering a 940-file codebase. Critical payment and exam flows lack automated tests.

---

## PART 3: SCORES

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Architecture Score** | **72/100** | Strong patterns (service layer, audit, workflow) undermined by SQLite choice and missing infrastructure (migrations, connection pooling). |
| **Security Score** | **78/100** | Excellent defense-in-depth (JWT, CSRF, CSP, rate limiting, sanitization, audit), but SQLite limitations and potential secret exposure are concerns. |
| **Performance Score** | **58/100** | In-memory caching is good, but SQLite write serialization, no CDN integration, large bundle risk, and no database connection pooling are significant bottlenecks. |
| **Code Quality Score** | **82/100** | Strong TypeScript strict mode, centralized utilities, consistent patterns, well-structured service layer. Deducted for `any` usage in critical modules and minimal tests. |
| **Scalability Score** | **45/100** | SQLite is the primary limitation. In-memory rate limiting, no horizontal scaling support, and process-level caching all limit scalability. |
| **Maintainability Score** | **80/100** | Clear module structure, comprehensive audit trail, version history, and workflow engine make maintenance easier. Deducted for multiple seed files and deprecated models. |
| **Testing Readiness Score** | **35/100** | Only 21 test files for 940 source files. Critical paths (payment, exam, auth) lack comprehensive test coverage. vitest is configured but underutilized. |
| **Production Readiness Score** | **52/100** | Strong security and monitoring foundations (Sentry, health checks, audit logs), but SQLite, missing migrations, insufficient tests, and rate limiting gaps prevent production confidence. |

---

## PART 4: TOP 50 ISSUES (Ordered by Severity)

### 🔴 CRITICAL (Severity 1-10)

**1. SQLite cannot handle concurrent write operations**  
Severity: 10 | Category: Architecture  
SQLite serializes all writes. Under load, concurrent exam submissions, payment processing, and analytics recording will cause timeouts and data loss. This is the fundamental scaling bottleneck.

**2. Hardcoded JWT secret in .env committed to project**  
Severity: 9 | Category: Security  
`JWT_SECRET=0fb77bb415aa4431d519cc9d2708e3c039cefebd3e82f30ae4b60d917340fd90` is hardcoded. If this file is in version control, all user sessions can be forged. Must be rotated and moved to a secrets manager.

**3. No database connection pooling**  
Severity: 9 | Category: Performance  
Each request creates a new libSQL connection. Under concurrent load, this leads to file descriptor exhaustion and degraded performance. Prisma with SQLite doesn't natively support pooling.

**4. Rate limiting is process-local, not distributed**  
Severity: 8 | Category: Security  
Rate limit counters use in-memory `Map`. In Vercel serverless or multi-instance deployments, each instance has independent counters, making rate limits easily bypassable by distributed requests.

**5. Cron endpoint authentication potentially unprotected**  
Severity: 8 | Category: Security  
`/api/admin/cron/publish-scheduled` and `/api/admin/cron/purge-audit-logs` must verify they're called by Vercel cron, not arbitrary users. The public route list and auth bypass logic need verification.

**6. No production database migration strategy**  
Severity: 8 | Category: Operations  
Schema.prisma defines 79 models but there's no visible CI/CD pipeline for running `prisma migrate deploy` in production. Schema changes require manual intervention.

**7. `.env` file with credentials potentially in version control**  
Severity: 8 | Category: Security  
`.env` contains JWT_SECRET, SUPER_ADMIN_PASSWORD. Verify `.gitignore` properly excludes this file. If committed, secrets are in git history.

**8. Insufficient test coverage for production**  
Severity: 7 | Category: Quality  
21 test files for 940 source files (~2.2% coverage). Payment flows, exam submissions, auth flows, and admin operations lack automated test coverage.

**9. CSP `connect-src 'self'` may block legitimate external calls**  
Severity: 7 | Category: Security  
The Content Security Policy restricts `connect-src` to `'self'`. If Supabase, UploadThing, or other external services are called from the client, they'll be blocked.

**10. CSRF disabled in development environment**  
Severity: 6 | Category: Security  
`ENABLE_CSRF=false` in `.env` means CSRF protection is never tested during development. Integration issues with CSRF tokens won't be caught until production.

### 🟠 HIGH (Severity 11-20)

**11. Middleware auth fallback returns JWT payload without DB verification**  
Severity: 6 | Category: Security  
In `proxy.ts:129-131`, if `db.user.findUnique` throws, the catch block returns `payload` (JWT data) without DB role verification. A user whose DB record is deleted but whose JWT is still valid could bypass role checks.

**12. In-memory permission cache not safe across isolates**  
Severity: 5 | Category: Reliability  
`auth.ts:81-83` uses module-level mutable state for permission caching. In Edge Runtime or isolated contexts, this cache is undefined, causing repeated DB queries.

**13. No `Strict-Transport-Security` header**  
Severity: 5 | Category: Security  
Security headers don't include HSTS. HTTPS enforcement relies entirely on the hosting platform, leaving man-in-the-middle attack vectors if SSL termination is misconfigured.

**14. AuditLog immutability enforced at ORM layer only**  
Severity: 5 | Category: Security  
The Prisma middleware blocks update/delete on AuditLog, but this can be bypassed by direct SQL queries. For true immutability, consider database-level constraints.

**15. `any` type usage in critical soft-delete module**  
Severity: 4 | Category: Quality  
`soft-delete.ts` uses `any` for Prisma client types throughout (~50+ occurrences). This weakens type safety in a module that handles data deletion.

**16. Large component count increases bundle risk**  
Severity: 4 | Category: Performance  
339 components + recharts + framer-motion + tiptap + katex + markmap + xlsx = significant bundle size risk. No visible code splitting strategy beyond Next.js defaults.

**17. MathJax loaded from CDN via dangerouslySetInnerHTML**  
Severity: 4 | Category: Performance / Security  
Third-party JavaScript loaded via `dangerouslySetInnerHTML` in the root layout. While CSP nonce-protected, this adds ~300KB+ to page load and is render-blocking for math content.

**18. Upstash Redis dependency but no visible usage**  
Severity: 4 | Category: Dependency  
`@upstash/ratelimit` and `@upstash/redis` are dependencies but the rate limiter uses in-memory storage. These are dead dependencies adding bundle weight.

**19. No Content-Security-Policy report-uri**  
Severity: 4 | Category: Security  
CSP is configured but without `report-uri` or `report-to`. Policy violations are silently ignored, making it impossible to detect XSS attempts or misconfigurations.

**20. Supabase SSR dependency may be unused**  
Severity: 3 | Category: Dependency  
`@supabase/ssr` and `@supabase/supabase-js` are installed but no visible Supabase usage in the codebase. If not used, these add unnecessary attack surface and bundle weight.

### 🟡 MEDIUM (Severity 21-35)

**21. Rate limiter cleanup interval runs globally**  
Severity: 3 | Category: Reliability  
`rate-limit.ts:51` sets a global `setInterval` that runs every 60s and never stops. In test environments, this can cause Jest/Vitest worker leaks.

**22. Multiple seed files suggest iterative development**  
Severity: 3 | Category: Maintainability  
6 seed files (`seed.ts`, `seed-all.ts`, `seed-comprehensive.ts`, `seed-content.ts`, `seed-db.ts`, `seed-missing.ts`) should be consolidated.

**23. `suppressHydrationWarning` on `<html>` and `<body>`**  
Severity: 3 | Category: Quality  
Used to suppress next-themes hydration mismatch, but masks legitimate hydration errors. Consider using a more targeted approach.

**24. No request body size limits on API routes**  
Severity: 3 | Category: Security  
API routes accept JSON bodies without explicit size limits. While Next.js has defaults, explicit limits prevent memory exhaustion attacks.

**25. Missing `X-Powered-By: false` in proxy headers**  
Severity: 2 | Category: Security  
`next.config.ts` disables `poweredByHeader` but the proxy doesn't explicitly remove it. Header may leak framework information.

**26. Content version snapshots stored as JSON strings**  
Severity: 2 | Category: Performance  
`ContentVersion.snapshot` stores full record state as JSON string. Large content (lectures with rich HTML) could create very large snapshot records.

**27. No database indexing strategy documentation**  
Severity: 2 | Category: Maintainability  
Schema has many `@@index` declarations but no documentation explaining the indexing strategy or which queries each index serves.

**28. Deprecated `LessonExam` model still in schema**  
Severity: 2 | Category: Technical Debt  
Model is marked "deprecated — kept for backward compat" but still present. Should be removed after migration.

**29. Mixed `export default` and named exports in hooks**  
Severity: 2 | Category: Code Quality  
Some hooks use `export default`, others use named exports. Inconsistent export patterns.

**30. No API versioning strategy**  
Severity: 2 | Category: Architecture  
All API routes are under `/api/` with no version prefix. Breaking changes require coordinated frontend/backend updates.

**31. Audit log hash doesn't include `oldData`/`newData`**  
Severity: 2 | Category: Security  
Hash is computed from `action|entityType|entityId|adminId|createdAt` but doesn't include change data. Tampering with audit log content while preserving metadata is possible.

**32. No graceful shutdown handling for in-memory caches**  
Severity: 2 | Category: Reliability  
Rate limit counters, permission cache, and CSRF cache are lost on process restart. No persistence or warm-up strategy.

**33. Missing `Cache-Control` on authentication endpoints**  
Severity: 2 | Category: Security  
Login/register responses may be cached by intermediaries. Auth endpoints should have `Cache-Control: no-store`.

**34. Payment amount validation allows zero**  
Severity: 2 | Category: Business Logic  
`createPaymentSchema` allows `amount: 0`. While free content exists, zero-amount payments may cause confusion in payment review.

**35. No database backup strategy visible**  
Severity: 2 | Category: Operations  
SQLite file-based database requires explicit backup strategy. No visible backup scripts or cron jobs.

### 🔵 LOW (Severity 36-50)

**36. `console.log` used in production logger**  
Severity: 1 | Category: Quality  
Logger uses `console.log` for info level. In production, structured logging to a service (Datadog, LogDNA) would be more effective.

**37. Missing TypeScript strict null checks in some areas**  
Severity: 1 | Category: Quality  
While `strictNullChecks` is enabled, some service files use non-null assertions (`!`) excessively.

**38. No i18n framework**  
Severity: 1 | Category: Architecture  
Bengali strings are hardcoded throughout the codebase. No internationalization framework for future language support.

**39. `dangerouslySetInnerHTML` usage in rich content rendering**  
Severity: 1 | Category: Security  
While DOMPurify sanitizes content, `dangerouslySetInnerHTML` is inherently risky. Consider using a React HTML parser.

**40. No API response time monitoring**  
Severity: 1 | Category: Observability  
Request logger tracks duration but there's no alerting on slow API endpoints.

**41. Missing `robots.txt` restrictions for admin routes**  
Severity: 1 | Category: SEO  
`robots.txt` should explicitly disallow `/admin/` routes to prevent indexing.

**42. No database query performance monitoring**  
Severity: 1 | Category: Performance  
Prisma query logging is limited to `error` and `warn` in production. Slow queries go undetected.

**43. Inconsistent `try/catch` patterns in API routes**  
Severity: 1 | Category: Code Quality  
Some routes use `handleApiError()`, others use raw try/catch. Should be consistent.

**44. Missing `Content-Security-Policy` for style-src nonce**  
Severity: 1 | Category: Security  
`style-src` uses `'unsafe-inline'` instead of nonce-based CSP. Inline styles are a minor XSS vector.

**45. No feature flags system**  
Severity: 1 | Category: Architecture  
`features.ts` exists but doesn't implement a proper feature flag system for gradual rollouts.

**46. Missing input sanitization on user profile fields**  
Severity: 1 | Category: Security  
User profile fields (name, institute, phone) may accept arbitrary strings without sanitization.

**47. No API response compression configuration**  
Severity: 1 | Category: Performance  
While `compress: true` is set in next.config, response compression for large payloads isn't explicitly configured.

**48. Missing `X-Content-Type-Options` on file upload responses**  
Severity: 1 | Category: Security  
Upload responses may not include nosniff header, allowing MIME type sniffing.

**49. No database connection health monitoring**  
Severity: 1 | Category: Observability  
Health endpoint checks connectivity but doesn't monitor connection pool stats or query latency trends.

**50. Missing `SameSite` attribute on CSRF cookie in edge cases**  
Severity: 1 | Category: Security  
CSRF cookie uses `sameSite: 'strict'` but some browsers handle strict differently in cross-origin navigations.

---

## SUMMARY

The Sikkha platform demonstrates **strong architectural patterns** in its audit system, soft delete implementation, editorial workflow, and security layers. The codebase is well-organized with clear separation of concerns, centralized utilities, and consistent patterns.

However, the **fundamental choice of SQLite as the production database** creates hard scaling limits that cannot be overcome with application-level optimizations. Combined with process-local rate limiting, insufficient test coverage, and potential secret exposure, the platform requires significant infrastructure work before handling production traffic at scale.

**Recommended Priority Actions:**
1. Migrate to PostgreSQL for production (connection pooling, concurrent writes)
2. Rotate and externalize all secrets (JWT_SECRET, CSRF_SECRET)
3. Implement distributed rate limiting (Upstash Redis or database-backed)
4. Add comprehensive test coverage for payment and exam flows
5. Set up CI/CD pipeline with database migrations
6. Audit `.gitignore` to ensure `.env` is excluded
7. Add CSP reporting and HSTS headers
8. Consolidate seed files and remove deprecated models
