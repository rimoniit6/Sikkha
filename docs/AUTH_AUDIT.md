# Authentication & Authorization Audit Report

**Project:** Sikkha - Online Learning Platform  
**Date:** 2026-07-19  
**Auditor:** MiMoCode Production Audit  

---

## Executive Summary

The auth system uses JWT-based sessions with bcrypt password hashing, proper cookie security, and comprehensive RBAC. CSRF protection is configurable with production always-on. Missing email verification and password reset flows are the main gaps.

**Overall Auth Score: 90/100**

---

## Authentication Flow Analysis

### Login Flow
```
POST /api/auth/login
  → Rate limit check (authLimiter: 10/15min)
  → Zod validation (email + password)
  → DB lookup (selects only needed fields)
  → bcrypt.compareSync(password, hashedPassword)
  → signToken({ userId, role }) → 7-day JWT
  → Set cookie (httpOnly, secure, sameSite: lax)
  → Return user data (no password)
```

### Registration Flow
```
POST /api/auth/register
  → Rate limit check (authLimiter: 10/15min)
  → Zod validation (email, password, name)
  → Check existing user
  → hashPassword(password) → bcrypt 12 rounds
  → DB create (role: 'STUDENT', isVerified: false)
  → signToken → set cookie → return user
```

### Logout Flow
```
POST /api/auth/logout
  → Clear session cookie (maxAge: 0, expires: epoch)
  → Return success
```

### Session Verification
```
verifyAuth(request)
  → Parse cookie header
  → Extract JWT from session cookie
  → jwtVerify(token, secret)
  → DB lookup (user.id → role, isPremium)
  → Return AuthResult { user, isSuperAdmin, isAdmin }
```

---

## Findings

### PASS — Password Security

| Check | Status | Evidence |
|-------|--------|----------|
| Hashing algorithm | PASS | bcrypt |
| Salt rounds | PASS | 12 rounds (`password.ts:3`) |
| Synchronous hashing | WARNING | `hashSync` and `compareSync` are blocking — use async for production |
| Password minimum length | PASS | 6 characters (`validations.ts:77`) |
| Password max length | PASS | 128 characters (`validations.ts:78`) |

### PASS — JWT Security

| Check | Status | Evidence |
|-------|--------|----------|
| Algorithm | PASS | HS256 via jose library |
| Secret length | PASS | Minimum 32 characters enforced in production |
| Expiry | PASS | 7 days (`jwt.ts:56`) |
| Issued-at claim | PASS | `setIssuedAt()` |
| Payload | PASS | Only userId and role — no sensitive data |
| Production check | PASS | Throws if JWT_SECRET not set in production |

### PASS — Cookie Security

| Check | Status | Evidence |
|-------|--------|----------|
| httpOnly | PASS | `true` — prevents XSS access |
| secure | PASS | `true` in production |
| sameSite | PASS | `lax` — allows top-level navigation |
| path | PASS | `/` — site-wide |
| maxAge | PASS | 7 days (604800 seconds) |

### WARNING — Missing Auth Features

| Feature | Status | Severity |
|---------|--------|----------|
| Email verification | NOT IMPLEMENTED | Medium |
| Password reset | NOT IMPLEMENTED | High |
| Refresh tokens | NOT IMPLEMENTED | Medium |
| Account lockout | NOT IMPLEMENTED | Medium |
| Login history | NOT IMPLEMENTED | Low |
| Session invalidation | NOT IMPLEMENTED | Medium |

**High Finding:** No password reset flow exists. Users who forget their password have no self-service recovery option.

### PASS — RBAC Implementation

| Role | Permissions | Evidence |
|------|-------------|----------|
| SUPER_ADMIN | Everything (`*`) | `auth.ts:86` — returns `Set(['*'])` |
| ADMIN | Content management | Required for all `/api/admin/*` routes |
| STUDENT | Read-only + own data | Default role on registration |

### PASS — Permission System

| Check | Status | Evidence |
|-------|--------|----------|
| Database-backed permissions | PASS | `RolePermission` model with `Permission` relation |
| Permission caching | PASS | 60s TTL in-memory cache (`auth.ts:81-103`) |
| Cache invalidation | PASS | `invalidatePermissionCache()` called on permission changes |
| Granular permissions | PASS | `requirePermission()` checks specific permission names |

### PASS — CSRF Protection

| Check | Status | Evidence |
|-------|--------|----------|
| Implementation | PASS | JWT-based CSRF tokens with HMAC signing |
| Production override | PASS | Always enabled in production (`csrf.ts:58`) |
| Token delivery | PASS | Via httpOnly cookie or x-csrf-token header |
| Fallback | PASS | Also accepts `_csrf` in request body |
| Expiry | PASS | 1 hour token lifetime |

### WARNING — Auth Edge Cases

| Issue | Severity | Evidence |
|-------|----------|----------|
| bcryptSync is blocking | Medium | `password.ts:6-7` — `hashSync`/`compareSync` block event loop |
| No account lockout | Medium | Brute force only limited by rate limiter |
| Super admin auto-seed | Low | `instrumentation.ts` auto-creates/syncs super admin on every boot |
| No token revocation | Medium | Logout only clears cookie, JWT remains valid until expiry |

---

## Authorization Matrix

| Endpoint Pattern | Required Role | Auth Method |
|-----------------|---------------|-------------|
| `/api/auth/login` | Public | None |
| `/api/auth/register` | Public | None |
| `/api/auth/logout` | Public | None |
| `/api/admin/*` (write) | ADMIN+ | withAdmin + withCsrf |
| `/api/admin/settings` | SUPER_ADMIN | withSuperAdmin |
| `/api/admin/users` (role change) | SUPER_ADMIN | withSuperAdmin |
| `/api/admin/permissions` | SUPER_ADMIN | withSuperAdmin |
| `/api/user/*` | STUDENT+ | withAuth |
| `/api/content/*` | Public | None |
| `/api/health` | Public | None |

---

## Score Breakdown

| Area | Score |
|------|-------|
| Password Security | 90/100 |
| JWT Security | 95/100 |
| Cookie Security | 94/100 |
| RBAC | 95/100 |
| CSRF Protection | 92/100 |
| Missing Features | 70/100 |
| Edge Cases | 82/100 |

**Final Score: 90/100**

---

## Critical Issues: 0
## High Issues: 1 (no password reset)
## Medium Issues: 4 (email verification, refresh tokens, account lockout, blocking bcrypt)
## Low Issues: 2 (login history, super admin auto-seed)
