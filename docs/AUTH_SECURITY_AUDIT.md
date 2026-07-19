# Authentication & Authorization Security Audit

> **Date:** 2026-07-18
> **Scope:** Complete security audit of authentication and authorization system
> **Method:** Source code inspection + architectural review

---

## Certification Status: ⚠️ CONDITIONAL PASS — Critical Issues Found

**3 critical issues, 4 high issues, 6 medium issues identified.**

---

## Authentication Score: 72/100

| Category | Score | Notes |
|----------|-------|-------|
| Login flow | 8/10 | Rate limiting, bcrypt, generic errors. Missing: failed attempt tracking |
| Logout flow | 5/10 | Cookie cleared but JWT not revoked — 7-day validity remains |
| Registration | 4/10 | No email verification, weak password policy (6 chars) |
| JWT | 6/10 | Hardcoded fallback secret, symmetric algorithm, no revocation |
| Session management | 6/10 | 7-day expiry, no refresh flow, no heartbeat |
| CSRF | 9/10 | Production always-on, 30s cache, proper invalidation |
| Cookie security | 9/10 | httpOnly, secure, sameSite: lax |
| Token storage | 7/10 | HttpOnly cookie (good), but localStorage also stores user data |

---

## Authorization Score: 85/100

| Category | Score | Notes |
|----------|-------|-------|
| Role-based access | 9/10 | All admin routes protected except 2 |
| Permission system | 6/10 | Exists but only used for its own management endpoint |
| Horizontal privilege | 9/10 | All userId lookups properly scoped |
| Vertical privilege | 8/10 | Admin pages protected, 2 API routes unprotected |
| Page protection | 9/10 | Proxy blocks non-admin from /admin/* pages |
| API protection | 8/10 | 2 admin API routes missing auth checks |

---

## Critical Issues (Must Fix)

### CRITICAL-1: Hardcoded JWT Fallback Secret

**File:** `src/lib/auth/jwt.ts` line 3
**Impact:** If `JWT_SECRET` is unset in production, the application uses a publicly visible hardcoded string. Any attacker can forge valid JWTs.
**Fix:** Crash on startup if `JWT_SECRET` is missing in production. Never fall back to a hardcoded value.

### CRITICAL-2: Unprotected Admin Analytics Track Endpoint

**File:** `src/app/api/admin/analytics/track/route.ts`
**Impact:** Any authenticated user (including STUDENT) can inject analytics events with arbitrary userIds. This poisons analytics data and could be used for data manipulation.
**Fix:** Add `withAdmin()` or validate userId against authenticated user.

### CRITICAL-3: Unprotected Admin Exam Questions Endpoint

**File:** `src/app/api/admin/exams/questions/route.ts`
**Impact:** Any authenticated user can fetch the full question bank with correct answers. This is an exam content leak.
**Fix:** Add `withAdmin()`.

---

## High Issues (Should Fix)

### HIGH-1: Unprotected File Upload

**File:** `src/app/api/local-upload/route.ts`
**Impact:** Listed in PUBLIC_API_ROUTES with zero authentication. Any unauthenticated user can upload arbitrary files to the server's public directory.
**Fix:** Remove from PUBLIC_API_ROUTES and add `withAdmin()`.

### HIGH-2: No Email Verification

**File:** `src/app/api/auth/register/route.ts`
**Impact:** Users are immediately logged in after registration. Enables account squatting and spam.
**Fix:** Implement email verification flow.

### HIGH-3: All Auth Endpoints CSRF-Exempt

**File:** `src/proxy.ts` line 171
**Impact:** Login, logout, register are CSRF-exempt. If `sameSite` is ever weakened, these become CSRF-vulnerable.
**Fix:** Consider adding CSRF to login/register (low priority given sameSite: lax).

### HIGH-4: Latent Header Injection Risk

**File:** `src/proxy.ts` lines 187-188
**Impact:** `x-user-id` and `x-user-role` headers are set after verification. If any downstream handler trusts these headers (instead of calling verifyAuth), an attacker could spoof them.
**Fix:** Ensure no downstream handler reads these headers. Consider removing them.

---

## Medium Issues

### MEDIUM-1: No JWT Revocation

**File:** `src/app/api/auth/logout/route.ts`
**Impact:** Logout clears the cookie but the JWT remains valid for 7 days. Stolen tokens survive logout.
**Fix:** Implement token blocklist or short-lived refresh tokens.

### MEDIUM-2: Weak Password Policy

**File:** `src/lib/validations.ts`
**Impact:** Registration requires only 6 characters with no complexity requirements.
**Fix:** Require 8+ characters with uppercase, number, and symbol.

### MEDIUM-3: User Data in localStorage

**File:** `src/store/auth.ts`
**Impact:** User object (including role, email, phone) stored in localStorage. XSS exposure.
**Fix:** Minimize data in localStorage. Never trust client-side role for authorization decisions.

### MEDIUM-4: Client-Side Role Tampering

**File:** `src/store/auth.ts` line 44
**Impact:** `updateUser` allows overwriting any user field including role. If any component trusts `user.role` without server verification, this is an escalation vector.
**Fix:** Ensure all authorization decisions are server-side only.

### MEDIUM-5: Public API Routes Include Sensitive Endpoints

**File:** `src/proxy.ts` lines 14-63
**Impact:** `/api/uploadthing`, `/api/local-upload`, `/api/payment/accounts` are public without per-route auth checks.
**Fix:** Add per-route auth checks or remove from public list.

### MEDIUM-6: Admin Protection Only on Page Routes

**File:** `src/proxy.ts` lines 205-208
**Impact:** `/admin/*` page routes are protected at proxy level, but admin API routes rely on individual handler checks. If any handler forgets, the endpoint is unprotected.
**Fix:** Consider proxy-level protection for `/api/admin/*` routes.

---

## Low Issues

| # | File | Issue |
|---|------|-------|
| 1 | `proxy.ts:139` | `pathname.includes('.')` skips auth for dot-containing paths |
| 2 | `proxy.ts:107` | CSP nonce set as non-httpOnly cookie |
| 3 | `store/auth.ts:44` | `updateUser` allows client-side role/premium tampering |
| 4 | `AuthProvider.tsx` | No periodic session re-validation |
| 5 | `me/route.ts:18` | No format validation on `queryUserId` parameter |
| 6 | `auth.ts:44` | Silent catch swallows database errors with no logging |
| 7 | `jwt.ts:21` | Symmetric algorithm (HS256) — secret leak = full token forgery |
| 8 | `csrf.ts:86` | Hardcoded CSRF fallback secret in development |

---

## Protected Routes Summary

### Admin Routes (67 total)

| Protected | Count | Notes |
|-----------|-------|-------|
| ✅ Protected | 65 | All use withAdmin/requireAdmin/requireSuperAdmin/requirePermission |
| ❌ Unprotected | 2 | `admin/analytics/track`, `admin/exams/questions` |

### User Routes (15+ total)

| Protected | Count | Notes |
|-----------|-------|-------|
| ✅ Protected | 15+ | All use verifyAuth/withAuth with userId scoping |
| ❌ Unprotected | 0 | None found |

### Public Routes (40+ total)

| Route | Purpose | Risk |
|-------|---------|------|
| `/api/auth/*` | Auth flows | LOW — CSRF-exempt but sameSite: lax |
| `/api/classes` | Class listing | NONE — public content |
| `/api/lectures` | Lecture listing | NONE — public content |
| `/api/mcq` | MCQ listing | NONE — public content |
| `/api/cq` | CQ listing | NONE — public content |
| `/api/config` | Site config | LOW — may expose internal settings |
| `/api/stats` | Public stats | NONE — aggregated data |
| `/api/payment/accounts` | Payment numbers | LOW — exposes payment account details |
| `/api/local-upload` | File upload | **HIGH** — no auth, arbitrary file upload |
| `/api/uploadthing` | File upload | MEDIUM — depends on UploadThing config |
| `/api/csrf-token` | CSRF token | NONE — public by design |

---

## Horizontal Privilege Escalation

| Check | Status | Evidence |
|-------|--------|----------|
| User A cannot access User B's profile | ✅ PASS | All userId lookups forced to auth.user.id for non-admins |
| User A cannot access User B's purchases | ✅ PASS | `/api/payment` forces userId for non-admins |
| User A cannot access User B's bookmarks | ✅ PASS | `/api/bookmarks` uses auth.user.id |
| User A cannot access User B's dashboard | ✅ PASS | `/api/user/dashboard` uses auth.user.id |
| User A cannot access User B's feedback | ✅ PASS | `/api/user/feedback` uses auth.user.id |
| User A cannot access User B's certificates | ✅ PASS | `/api/courses/certificate` checks ownership |

**Verdict: PASS — No horizontal privilege escalation found.**

---

## Vertical Privilege Escalation

| Check | Status | Evidence |
|-------|--------|----------|
| Student cannot access admin pages | ✅ PASS | Proxy redirects to / |
| Student cannot access admin API (most) | ✅ PASS | withAdmin returns 403 |
| Student CAN access admin/analytics/track | ❌ FAIL | No auth check in handler |
| Student CAN access admin/exams/questions | ❌ FAIL | No auth check in handler |
| Student cannot modify own role via API | ✅ PASS | No endpoint allows role changes |
| Student cannot become admin via localStorage | ✅ PASS | Server-side checks always verify role |

**Verdict: FAIL — 2 vertical privilege escalation vectors found.**

---

## Security Headers

| Header | Status | Value |
|--------|--------|-------|
| HttpOnly cookie | ✅ PASS | Session cookie is httpOnly |
| Secure cookie | ✅ PASS | `secure: true` in production |
| SameSite cookie | ✅ PASS | `sameSite: 'lax'` |
| CSRF cookie | ✅ PASS | httpOnly, secure, sameSite: strict |
| CSP | ✅ PASS | Nonce-based CSP |
| HSTS | ✅ PASS | `max-age=31536000, includeSubDomains, preload` |
| X-Frame-Options | ✅ PASS | DENY |
| X-Content-Type-Options | ✅ PASS | nosniff |
| Referrer-Policy | ✅ PASS | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ PASS | Restrictive defaults |

---

## Final Verdict

### Overall Security Score: 79/100

| Category | Score |
|----------|-------|
| Authentication | 72/100 |
| Authorization | 85/100 |
| Data Protection | 85/100 |
| Headers | 95/100 |
| **Overall** | **79/100** |

### PASS/FAIL Decision

| Criterion | Status |
|-----------|--------|
| Zero privilege escalation | ❌ FAIL — 2 vertical escalation vectors |
| Zero authentication bypass | ❌ FAIL — hardcoded JWT fallback secret |
| Zero data integrity issues | ✅ PASS |
| Zero inconsistent purchase behaviors | ✅ PASS |

**Verdict: ❌ FAIL — Not certified for production until critical issues are fixed.**

---

## Required Fixes Before Production

| Priority | Issue | Fix |
|----------|-------|-----|
| CRITICAL | Hardcoded JWT fallback secret | Crash on missing JWT_SECRET in production |
| CRITICAL | Unprotected admin/analytics/track | Add withAdmin() |
| CRITICAL | Unprotected admin/exams/questions | Add withAdmin() |
| HIGH | Unprotected local-upload | Remove from PUBLIC_API_ROUTES, add withAuth() |

---

*Security audit complete. 3 critical issues must be fixed before production deployment.*
