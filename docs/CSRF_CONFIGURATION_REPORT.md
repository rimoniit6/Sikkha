# CSRF Configuration Report

> **Feature:** Configurable CSRF protection via Admin Security Settings
> **Date:** 2026-07-18

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/lib/csrf.ts` | Refactored: dynamic `isCsrfEnabled()` with development override | 110 lines (was 124) |
| `src/app/api/admin/settings/route.ts` | Added CSRF override on settings save | +4 lines |
| `src/components/admin/settings/SecurityTab.tsx` | NEW: Security settings UI | 62 lines |
| `src/components/admin/AdminSettingsPage.tsx` | Added Security tab, state, hydration, save | +8 lines |

**Total: 4 files modified/created.**

---

## Database Changes

**None.** The `SiteSetting` model is a key-value store. The new setting `enableCsrfProtection` is stored as a regular key-value pair:

| Key | Value | Group | Label |
|-----|-------|-------|-------|
| `enableCsrfProtection` | `"true"` or `"false"` | `security` | `CSRF সুরক্ষা সক্রিয়` |

No schema migration required.

---

## Admin UI Changes

### New Tab: নিরাপত্তা (Security)

Added to Admin Settings page as the 9th tab (between Legal and Database).

**Contents:**
- CSRF Protection toggle (Switch component)
- Description text explaining what CSRF does
- Production warning: "CSRF protection cannot be disabled in Production"

**Behavior:**
- Toggle is enabled/disabled based on `enableCsrfProtection` setting
- In production, toggle is **disabled** with warning message
- In development, toggle is fully functional

---

## Architecture

### How CSRF Settings Flow

```
Admin toggles CSRF setting
  → AdminSettingsPage saves to SiteSetting table
  → API route calls setCsrfDevelopmentOverride()
  → isCsrfEnabled() reads override on next request
  → CSRF middleware uses new state
```

### Environment Rules

| Environment | CSRF Behavior | Admin Toggle |
|------------|---------------|--------------|
| **Production** | Always enabled | Disabled (greyed out) |
| **Development** | Follows admin setting | Enabled (functional) |

### Resolution Order

```
isCsrfEnabled():
  1. Production → always true (hardcoded safety)
  2. Development → _csrfDevelopmentOverride (from admin setting)
  3. Development → ENABLE_CSRF env var (fallback)
  4. Development → false (default)
```

---

## Security Implications

### Production Safety

**CSRF cannot be disabled in production.** The `isCsrfEnabled()` function checks `process.env.NODE_ENV === 'production'` first and returns `true` regardless of any override. This is a hardcoded safety net.

### Development Flexibility

In development, admins can toggle CSRF on/off via the admin UI. This is useful for:
- Testing payment flows without CSRF tokens
- Debugging form submissions
- Local development convenience

### Attack Surface

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Admin disables CSRF in dev | LOW | Only affects development environment |
| Admin tries to disable in prod | NONE | Toggle is disabled, hardcoded safety |
| Setting corrupted in DB | LOW | `isCsrfEnabled()` falls back to env var logic |
| Race condition on setting change | LOW | Override is applied synchronously in API handler |

---

## Development Verification

### Test: CSRF Disabled (Default)

1. Start dev server (`npm run dev`)
2. Admin Settings → Security tab
3. Toggle CSRF OFF → Save
4. Navigate to payment page
5. Fill in transaction ID + payment number
6. **Expected:** Submit button is ENABLED
7. Submit payment
8. **Expected:** Payment succeeds (no CSRF validation)

### Test: CSRF Enabled

1. Admin Settings → Security tab
2. Toggle CSRF ON → Save
3. Navigate to payment page
4. Fill in transaction ID + payment number
5. **Expected:** Submit button is ENABLED (CSRF token loads automatically)
6. Submit payment
7. **Expected:** Payment succeeds (CSRF token validated)

---

## Production Verification

### Test: Toggle Disabled

1. Deploy to production
2. Admin Settings → Security tab
3. **Expected:** CSRF toggle is **disabled/greyed out**
4. **Expected:** Warning message: "CSRF protection cannot be disabled in Production"
5. **Expected:** CSRF is always active regardless of DB setting

### Test: Forms Work

1. Payment form → Submit → **Expected:** Works (CSRF token provided)
2. Login form → Submit → **Expected:** Works
3. Registration form → Submit → **Expected:** Works
4. Profile update → Submit → **Expected:** Works
5. Admin forms → Submit → **Expected:** Works

---

## Files NOT Modified

| File | Reason |
|------|--------|
| `src/hooks/use-csrf.ts` | Already refactored in CSRF_REFACTOR_REPORT.md |
| `src/components/payment/steps/PayStep.tsx` | Already updated in CSRF_REFACTOR_REPORT.md |
| `src/components/payment/PaymentPage.tsx` | Already updated in CSRF_REFACTOR_REPORT.md |
| `src/proxy.ts` | Uses `csrfMiddleware()` which calls `isCsrfEnabled()` — automatically uses new logic |
| `src/app/api/csrf-token/route.ts` | Uses `isCsrfEnabled()` — automatically uses new logic |
| `src/app/api/payment/route.ts` | Uses `withCsrf()` which calls `verifyCsrfFromRequest()` — automatically uses new logic |
| `src/app/api/admin/payments/route.ts` | Same as above |

---

## Remaining CSRF Technical Debt

| Item | Severity | Status |
|------|----------|--------|
| `api-client.ts` has separate CSRF fetch | LOW | Not affected — uses env var logic |
| No CSRF token refresh on expiry | MEDIUM | Out of scope |
| `withCsrfHeaders` adds empty header when token is null | LOW | Server ignores empty headers |
| No audit log for CSRF setting changes | LOW | Could be added to admin audit |

---

*CSRF configuration is now manageable via Admin Settings. Production safety is guaranteed by hardcoded checks.*
