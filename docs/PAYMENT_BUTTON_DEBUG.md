# Payment Button Debug — Root Cause Analysis

> **Bug:** Submit Payment button is disabled (50% opacity) and cannot be clicked
> **File:** `src/components/payment/steps/PayStep.tsx` line 175

---

## 1. Disabled Expression

```tsx
disabled={!transactionId || !paymentNumber || paymentStatus === 'submitting' || csrfLoading || !csrfToken}
```

This is a 5-part OR expression. If ANY part is `true`, the button is disabled.

---

## 2. Variable Trace

| Variable | Source | Initial Value | After User Input | `!value` | Disables Button? |
|----------|--------|---------------|------------------|----------|-----------------|
| `transactionId` | PaymentPage state | `''` | User types TXN ID | `false` (after input) | Only when empty |
| `paymentNumber` | PaymentPage state | `''` | User types number | `false` (after input) | Only when empty |
| `paymentStatus` | PaymentPage state | `'idle'` | Stays `'idle'` | N/A | Only when `'submitting'` |
| `csrfLoading` | `useCsrf()` | `true` | `false` (after fetch) | N/A | Only while loading |
| **`csrfToken`** | **`useCsrf()`** | **`null`** | **STAYS `null`** | **`true`** | **ALWAYS** |

---

## 3. Root Cause: `csrfToken` Never Becomes Non-Null

### The Chain

**Step 1: CSRF is disabled in development**

`src/lib/csrf.ts` lines 14-17:
```tsx
const CSRF_ENABLED =
  process.env.ENABLE_CSRF !== undefined
    ? process.env.ENABLE_CSRF === 'true'
    : process.env.NODE_ENV !== 'development'
```

In development: `NODE_ENV === 'development'` → `CSRF_ENABLED = false`

**Step 2: API returns empty token**

`src/app/api/csrf-token/route.ts` lines 11-13:
```tsx
if (!isCsrfEnabled()) {
  return NextResponse.json({ token: '', enabled: false })
}
```

Response: `{ token: '', enabled: false }`

**Step 3: Hook never sets the token**

`src/hooks/use-csrf.ts` lines 16-21:
```tsx
if (data.token) {          // ← data.token is '' (empty string)
  setToken(data.token)     // ← NEVER EXECUTES — '' is falsy
  tokenRef.current = data.token
  return data.token
}
```

Empty string `''` is falsy in JavaScript. `if ('')` is `false`. The `setToken` call is **never reached**.

**Step 4: Loading completes, token stays null**

Lines 25-27:
```tsx
} finally {
  setLoading(false)     // ← loading becomes false
}
```

`setLoading(false)` runs in `finally`. `setToken` never ran.

**Result:**
```
csrfLoading = false    ← loading completed
csrfToken = null       ← token never set
!csrfToken = true      ← BUTTON PERMANENTLY DISABLED
```

---

## 4. Why the Button Stays Disabled Forever

Even after the user fills in Transaction ID and Payment Number:

```
!transactionId = false    ← user filled it
!paymentNumber = false    ← user filled it
paymentStatus === 'submitting' = false
csrfLoading = false       ← loading finished
!csrfToken = true         ← STILL NULL — BLOCKS BUTTON
```

The `!csrfToken` condition is **always true** because the hook never sets the token when CSRF is disabled.

---

## 5. React Hook Form

**Not involved.** The payment form uses plain React state, not React Hook Form. Validation is handled inline in `handleSubmit()` (PaymentPage.tsx line 207).

---

## 6. Validation Errors

**Not visible.** The button is disabled before validation runs. The user never reaches `handleSubmit()` because the button can't be clicked.

---

## 7. Disabled State Updates

**Yes, it updates reactively.** The disabled expression is evaluated on every render. When the user types in the fields, `transactionId` and `paymentNumber` state updates trigger re-renders. But `csrfToken` never changes from `null`, so the button stays disabled.

---

## 8. CSRF Loading Trace

```
useCsrf() mount
  → loading = true
  → fetch('/api/csrf-token')
  → Response: { token: '', enabled: false }
  → data.token = '' (falsy)
  → setToken('') ← NOT CALLED (if ('') is false)
  → finally: setLoading(false)
  → loading = false, token = null
```

**CSRF loading DOES finish.** The problem is not that loading never completes — it's that the token is never set.

---

## 9. Production Behavior

In production (`NODE_ENV !== 'development'`):
- `CSRF_ENABLED = true`
- `/api/csrf-token` returns `{ token: '<valid-jwt>' }`
- `data.token` is truthy → `setToken(data.token)` IS called
- `csrfToken` becomes the JWT string
- Button CAN be enabled

**The bug only manifests when CSRF is disabled** (development mode, or `ENABLE_CSRF=false`).

---

## 10. Is This Intentional?

**No.** This is a bug. The button should be functional regardless of CSRF state. When CSRF is disabled, the payment should still work — the server skips CSRF validation anyway (`verifyCsrfFromRequest` returns `true` when disabled).

The UI does not communicate what is missing because:
- There's no error message saying "CSRF token failed to load"
- The disabled button has no tooltip explaining why
- The user has no way to know they need to wait for a token that will never arrive

---

## 11. Fix

### Option A: Fix the hook (recommended)

In `src/hooks/use-csrf.ts`, handle the empty token case:

```tsx
if (data.token !== undefined) {    // Changed from: if (data.token)
  setToken(data.token || null)     // Set token (even if empty string)
  tokenRef.current = data.token || null
  return data.token || null
}
```

Or more simply:
```tsx
if ('token' in data) {
  setToken(data.token || null)
  tokenRef.current = data.token || null
  return data.token || null
}
```

This ensures `setToken` is called even when the token is empty. The `null` vs `''` distinction doesn't matter for the button — both should allow submission when CSRF is disabled.

### Option B: Fix the button disabled condition

In `src/components/payment/steps/PayStep.tsx`, make the CSRF check conditional:

```tsx
disabled={!transactionId || !paymentNumber || paymentStatus === 'submitting' || (csrfLoading && csrfToken === null)}
```

This allows the button to be enabled when CSRF loading is complete, even if the token is null.

### Recommended: Option A

Option A is the correct fix because it addresses the root cause (hook not setting token) rather than working around it in the button.

---

## Summary

| Item | Value |
|------|-------|
| **Root cause** | `useCsrf` hook doesn't call `setToken` when API returns empty string (CSRF disabled) |
| **File** | `src/hooks/use-csrf.ts` line 17 |
| **Line** | `if (data.token)` — empty string is falsy |
| **Affected condition** | `!csrfToken` in PayStep.tsx line 175 |
| **Severity** | HIGH — button permanently disabled in development |
| **Production impact** | None (CSRF enabled in production → token is set) |
| **Recommended fix** | Change `if (data.token)` to `if ('token' in data)` in use-csrf.ts |
