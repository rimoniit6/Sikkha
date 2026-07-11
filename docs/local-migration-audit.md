# Local Development Dependency Audit

> Generated: 2026-07-10
> Project: Sikkha — Online Learning Platform

---

## 1. Supabase (Auth + Database)

| Property | Value |
|---|---|
| **Dependency** | Supabase Cloud (`supabase.co`) |
| **Env Vars** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **NPM Packages** | `@supabase/ssr@0.12.0`, `@supabase/supabase-js@2.108.1` |
| **ARB** | High — Auth + DB are core infrastructure |

### Files affected

| File | Lines | Why it exists |
|---|---|---|
| `src/lib/supabase/client.ts` | 1–22 | Browser-side Supabase client creation for auth |
| `src/lib/supabase/server.ts` | 1–42 | Server-side client + service-role client creation |
| `src/lib/supabase/middleware.ts` | 1–29 | Next.js middleware session refresh via Supabase |
| `src/providers/AuthProvider.tsx` | 1–56 | React context — listens to `onAuthStateChange`, syncs user |
| `src/store/auth.ts` | 1–54 | Zustand auth store with `supabaseUser`, `logout()` → `supabase.auth.signOut()` |
| `src/proxy.ts` | 3, 7–8, 87, 100–101, 136, 166, 181, 187, 199 | Middleware — validates session, looks up `supabaseUserId` in DB |
| `src/lib/auth.ts` | 2, 23–27 | `verifyAuth()` — calls `supabase.auth.getUser()`, finds DB user by `supabaseUserId` |
| `prisma/schema.prisma` | 141 | `User.supabaseUserId` field — links DB user to Supabase auth |
| `src/lib/db.ts` | 40 | Prisma connection string via `DATABASE_URL` (points to Supabase pg pooler) |
| `prisma.config.ts` | 9 | Prisma datasource URL |
| `.env` / `.env.example` | 1–6 | Database & Supabase credentials |
| `src/components/auth/SocialLoginPage.tsx` | 7, 22–31 | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| `scripts/sync-supabase-roles.ts` | — | Admin script to sync roles to Supabase |
| `next.config.ts` | 11, 15–16 | CSP allows `*.supabase.co` |
| `src/proxy.ts` | 100–101 | CSP allows `*.supabase.co` connections and frames |

### Dependencies within Supabase

| Sub-dependency | File | Lines |
|---|---|---|
| Google OAuth | `src/components/auth/SocialLoginPage.tsx` | 22–31 |
| Supabase Auth (email/password) | `src/providers/AuthProvider.tsx` | 35–56 |
| Supabase Auth (session) | `src/proxy.ts` | 136, 187 |
| Supabase PostgreSQL (via pg pooler) | `src/lib/db.ts` | 40 |

| Can it be removed? | Required for Local Dev? | Migration priority |
|---|---|---|
| Yes — replace with **NextAuth.js** or **lucia-auth** for auth, **local PostgreSQL** for DB | Yes (unless migrated) | **P0 — critical path** |
| Supabase PostgreSQL can be replaced with local Postgres | Yes (unless migrated) | **P0** |

---

## 2. UploadThing (File Storage)

| Property | Value |
|---|---|
| **Dependency** | UploadThing Cloud (`uploadthing.com`, `utfs.io`) |
| **Env Vars** | `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`, `UPLOADTHING_TOKEN` |
| **NPM Packages** | `uploadthing@7.7.4`, `@uploadthing/react@7.3.3` |
| **ARB** | Medium — file upload for screenshots, assignments, images |

### Files affected

| File | Lines | Why it exists |
|---|---|---|
| `src/lib/uploadthing/core.ts` | 1–104 | Defines upload routers: `imageUploader`, `pdfUploader`, `mediaUploader`, `screenshotUploader`, `assignmentUploader` |
| `src/lib/uploadthing/client.ts` | 1–12 | Client helpers — `UploadButton`, `UploadDropzone`, `useUploadThing` |
| `src/app/api/uploadthing/route.ts` | 1–2 | Route handler for upload callbacks |
| `src/components/ui/image-uploader.tsx` | 3 | `UploadDropzone` usage |
| `src/components/payment/PaymentPage.tsx` | 17, 177 | Payment screenshot upload via `useUploadThing('screenshotUploader')` |
| `src/components/exam/MCQExamPackagePurchaseDialog.tsx` | 19, 246 | Screenshot upload for MCQ purchases |
| `src/components/cq-exam/CQExamViewerPage.tsx` | 23, 671, 848 | CQ answer image upload |
| `src/components/cq-exam/CQExamPackagePurchaseDialog.tsx` | 19, 245 | CQ purchase screenshot upload |
| `src/features/course/student/components/StudentCourseDetailPage.tsx` | 21, 92 | Assignment upload via `useUploadThing('assignmentUploader')` |
| `src/proxy.ts` | 57, 100, 148 | Proxy routes `/api/uploadthing`, CSP allows `utfs.io`, `api.uploadthing.com` |
| `src/app/layout.tsx` | 130, 132 | Preconnect/dns-prefetch to `utfs.io` |
| `next.config.ts` | 11, 15, 36 | CSP + image remote patterns allow `uploadthing.com`, `utfs.io` |
| `.env` / `.env.example` | 8–10 | Credentials |

| Can it be removed? | Required for Local Dev? | Migration priority |
|---|---|---|
| Yes — replace with **local filesystem + local image serving** | Yes (unless migrated) | **P1** |

---

## 3. Upstash Redis (Rate Limiting + Cache Invalidation)

| Property | Value |
|---|---|
| **Dependency** | Upstash Redis Cloud (`upstash.io`) |
| **Env Vars** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **NPM Packages** | `@upstash/redis@1.38.0`, `@upstash/ratelimit@2.0.8` |
| **ARB** | Medium — rate limiting + content cache invalidation |

### Files affected

| File | Lines | Why it exists |
|---|---|---|
| `src/lib/rate-limit.ts` | 1–146 | `RateLimiter` class — sliding window rate limiting via Upstash Redis |
| `src/lib/cache-invalidate.ts` | 1–66 | Content version tracking via Redis — `invalidateContentCache()`, `getContentVersion()` |
| `next.config.ts` | 15 | CSP allows `*.upstash.io` |
| `.env` / `.env.example` | 19–20 | Credentials |

| Can it be removed? | Required for Local Dev? | Migration priority |
|---|---|---|
| Yes — replace with **in-memory rate limiting** + **in-memory version tracking** | Yes (unless migrated) | **P2** |

---

## 4. Sentry (Error Monitoring)

| Property | Value |
|---|---|
| **Dependency** | Sentry Cloud (`sentry.io`) |
| **Env Vars** | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |
| **NPM Packages** | `@sentry/nextjs@10.59.0` |
| **ARB** | Low — production error tracking only |

### Files affected

| File | Lines | Why it exists |
|---|---|---|
| `sentry.client.config.ts` | 1–17 | Browser-side Sentry init with replay integration |
| `sentry.server.config.ts` | 1–9 | Server-side Sentry init |
| `sentry.edge.config.ts` | 1–9 | Edge runtime Sentry init |
| `src/instrumentation.ts` | 1–13 | Next.js instrumentation — loads configs, `onRequestError` handler |
| `src/app/global-error.tsx` | 3, 14 | Global error boundary — `Sentry.captureException(error)` |
| `next.config.ts` | 3, 101–104 | `withSentryConfig()` wrapper |
| `next.config.ts` | 11, 15 | CSP allows `*.sentry.io` |
| `.env.example` | 31–33 | Placeholder DSN |

| Can it be removed? | Required for Local Dev? | Migration priority |
|---|---|---|
| Yes — gated by empty DSN; package can stay but not initialized if DSN is empty | **No** — safely excluded when DSN is empty | **P3** |

---

## 5. Google OAuth (via Supabase Auth)

| Property | Value |
|---|---|
| **Dependency** | Google OAuth (via Supabase) |
| **Env Vars** | `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI` |
| **ARB** | Medium — primary login method for students |

### Files affected

| File | Lines | Why it exists |
|---|---|---|
| `src/components/auth/SocialLoginPage.tsx` | 22–31 | `supabase.auth.signInWithOAuth({ provider: 'google' })` — Google login button |
| `src/lib/access-control.ts` (analytics) | — | Tracks `googleLogin` count |
| `src/components/analytics/AcquisitionDashboard.tsx` | 51 | Displays Google Login count |
| `src/app/api/admin/analytics/acquisition/route.ts` | 46, 52, 64, 71 | Counts users with `@gmail.com` as Google logins |
| `.env` / `.env.example` | 18, 37 | `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI` — Google OAuth callback |
| `src/proxy.ts` | 100 | CSP allows Supabase connect-src (needed for Google OAuth flow) |

| Can it be removed? | Required for Local Dev? | Migration priority |
|---|---|---|
| Yes — use **email/password auth** locally; Google OAuth is production-only | **No** — admins use email/password; students could use local test accounts | **P3** |

---

## 6. CDN Dependencies (External Network)

| Dependency | File | Lines | Purpose |
|---|---|---|---|
| **MathJax (jsdelivr)** | `src/app/layout.tsx` | 133, 151 | Math rendering fallback loaded from CDN |
| **jsdelivr** | `src/proxy.ts` | 87 | CSP allows `cdn.jsdelivr.net` script-src |
| **Google Fonts API** | `src/proxy.ts` | 97–98 | CSP allows `fonts.googleapis.com`, `fonts.gstatic.com` |

| Can it be removed? | Required for Local Dev? | Migration priority |
|---|---|---|
| MathJax: Yes — KaTeX is bundled locally; MathJax script tag is a fallback | **No** (local KaTeX works) | **P3** |
| Google Fonts: Yes — bundle fonts locally or remove | **No** (system fonts work) | **P3** |

---

## 7. Stripe (CSP-only)

| Property | Value |
|---|---|
| **Dependency** | Stripe (`checkout.stripe.com`, `js.stripe.com`) |
| **ARB** | Low — only in CSP headers, no source code imports found |

### Files affected

| File | Lines | Why it exists |
|---|---|---|
| `next.config.ts` | 11, 16 | CSP allows Stripe — prepared for future payment integration |

| Can it be removed? | Required for Local Dev? | Migration priority |
|---|---|---|
| Yes — remove from CSP | **No** — not used in code | **P3** |

---

## Summary

| # | Service | Priority | Replace with |
|---|---|---|---|
| 1 | **Supabase Auth + PostgreSQL** | **P0** | NextAuth.js / Lucia + local PostgreSQL |
| 2 | **UploadThing** | **P1** | Local filesystem + local image serving |
| 3 | **Upstash Redis** | **P2** | In-memory Map/Node-cache |
| 4 | **Sentry** | **P3** | Remove or keep (no-op when DSN empty) |
| 5 | **Google OAuth** | **P3** | Bypass with email/password for dev |
| 6 | **CDN (jsdelivr, Google Fonts)** | **P3** | Vendor locally or disable |
| 7 | **Stripe (CSP only)** | **P3** | Remove CSP entry (unused) |

### Migration approach (recommended)

1. **P0** → Replace Supabase with local PostgreSQL + a standalone auth library
2. **P1** → Replace UploadThing with a local `/uploads` directory + API endpoint
3. **P2** → Replace Upstash Redis with `node-cache` or a simple `Map<string, number>`
4. **P3** → Optionally clean up Sentry, CDN refs, and CSP entries
