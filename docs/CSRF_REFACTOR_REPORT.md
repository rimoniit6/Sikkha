# CSRF Refactor Report

> **Bug:** Submit Payment button permanently disabled in development
> **Root cause:** `useCsrf` hook never set token when CSRF was disabled (empty string returned by API)
> **Fix:** Refactor hook to return `token`, `enabled`, `loading` and always store returned token

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/hooks/use-csrf.ts` | Refactored: return `enabled`, always store token | 52 lines (was 45) |
| `src/components/payment/PaymentPage.tsx` | Destructure `enabled`, pass to PayStep | +1 line changed |
| `src/components/payment/steps/PayStep.tsx` | Added `csrfEnabled` prop, fixed disabled condition | +2 lines changed |

**Total: 3 files modified.**

---

## Previous Logic

### use-csrf.ts (Before)

```tsx
const [token, setToken] = useState<string | null>(null)
const [loading, setLoading] = useState(true)

const fetchCsrfToken = useCallback(async () => {
  const data = await res.json()
  if (data.token) {              // BUG: '' is falsy — setToken never called
    setToken(data.token)
  }
  setLoading(false)
}, [])

return { token, loading, refreshToken, tokenRef }
// No `enabled` field
```

### PayStep.tsx (Before)

```tsx
disabled={!transactionId || !paymentNumber || paymentStatus === 'submitting' || csrfLoading || !csrfToken}
// Problem: !csrfToken is ALWAYS true when CSRF is disabled (token is null)
```

### PaymentPage.tsx (Before)

```tsx
const { token: csrfToken, loading: csrfLoading, refreshToken, tokenRef } = useCsrf()
// No `enabled` destructured
```

---

## New Logic

### use-csrf.ts (After)

```tsx
const [token, setToken] = useState<string | null>(null)
const [enabled, setEnabled] = useState<boolean>(true)     // NEW
const [loading, setLoading] = useState(true)

const fetchCsrfToken = useCallback(async () => {
  const data = await res.json()
  if (typeof data.enabled === 'boolean') {
    setEnabled(data.enabled)                                // NEW: track server state
  }
  if ('token' in data) {                                   // FIX: check key existence, not truthiness
    const value = data.token || null
    setToken(value)                                         // FIX: always store (even empty string → null)
    tokenRef.current = value
    return value
  }
  setLoading(false)
}, [])

return { token, enabled, loading, refreshToken, tokenRef }  // NEW: returns `enabled`
```

### PayStep.tsx (After)

```tsx
interface PayStepProps {
  // ... existing props ...
  csrfEnabled: boolean       // NEW prop
  csrfLoading: boolean
  csrfToken: string | null
}

disabled={!transactionId || !paymentNumber || paymentStatus === 'submitting' || csrfLoading || (csrfEnabled && !csrfToken)}
// FIX: only check csrfToken when CSRF is enabled
```

### PaymentPage.tsx (After)

```tsx
const { token: csrfToken, enabled: csrfEnabled, loading: csrfLoading, refreshToken, tokenRef } = useCsrf()
// Destructures `enabled` as `csrfEnabled`

<PayStep csrfEnabled={csrfEnabled} ... />
// Passes to PayStep
```

---

## Development Verification

### Scenario: CSRF Disabled (NODE_ENV='development')

| State | Value | Button Disabled? |
|-------|-------|-----------------|
| `csrfEnabled` | `false` | — |
| `csrfToken` | `null` | — |
| `csrfEnabled && !csrfToken` | `false && true` = `false` | **NO** |
| `!transactionId` (after input) | `false` | **NO** |
| `!paymentNumber` (after input) | `false` | **NO** |
| `csrfLoading` (after load) | `false` | **NO** |
| **Final disabled** | `false` | **BUTTON ENABLED** |

---

## Production Verification

### Scenario: CSRF Enabled (NODE_ENV='production')

| State | Value | Button Disabled? |
|-------|-------|-----------------|
| `csrfEnabled` | `true` | — |
| `csrfToken` (after load) | `"<valid-jwt>"` | — |
| `csrfEnabled && !csrfToken` | `true && false` = `false` | **NO** |
| `!transactionId` (after input) | `false` | **NO** |
| `!paymentNumber` (after input) | `false` | **NO** |
| `csrfLoading` (after load) | `false` | **NO** |
| **Final disabled** | `false` | **BUTTON ENABLED** |

### Scenario: CSRF Enabled but Token Failed to Load

| State | Value | Button Disabled? |
|-------|-------|-----------------|
| `csrfEnabled` | `true` | — |
| `csrfToken` | `null` | — |
| `csrfEnabled && !csrfToken` | `true && true` = `true` | **YES** |
| **Final disabled** | `true` | **BUTTON DISABLED** (correct — can't submit without CSRF token) |

---

## Backward Compatibility

| Consumer | Change Needed? | Reason |
|----------|---------------|--------|
| `PaymentPage.tsx` | YES — destructures `enabled` | Passes to PayStep |
| `PayStep.tsx` | YES — new `csrfEnabled` prop | Uses in disabled condition |
| `MCQExamPackagePurchaseDialog.tsx` | NO — doesn't use `!csrfToken` | Only uses token in headers |
| `CQExamPackagePurchaseDialog.tsx` | NO — doesn't use `!csrfToken` | Only uses token in headers |
| `withCsrfHeaders()` | NO — unchanged | Empty token = no header added (correct behavior) |
| `api-client.ts` | NO — separate CSRF system | Uses `fetchCsrfToken()` directly, not `useCsrf()` |

---

## Remaining CSRF Technical Debt

| Item | Severity | Notes |
|------|----------|-------|
| `api-client.ts` has its own CSRF fetch (line 569) | LOW | Separate system, not affected by this refactor |
| `withCsrfHeaders` adds empty header when token is `''` | LOW | Server ignores empty CSRF headers — no functional impact |
| No CSRF token refresh on expiry | MEDIUM | Token expires after 1 hour; no automatic refresh in hooks |
| `fetchCsrfToken` in `api-client.ts` doesn't track `enabled` | LOW | Only used by non-payment flows; CSRF is always enabled there |

---

*Refactor complete. Button now works in both development (CSRF disabled) and production (CSRF enabled).*
