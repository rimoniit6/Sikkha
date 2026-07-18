# Admin → Settings Module: Production-Readiness Audit

**Date:** 2026-07-17
**Scope:** Verify every Admin Settings control actually changes system behavior (not just that UI/API exist). Audit-only — no code modified except test data, which was fully restored.
**Stack:** Next 16 (Turbopack, dev), Prisma + libSQL, TanStack Query, UploadThing.

---

## Summary Verdict

**NOT PRODUCTION-READY** — 1 critical functional defect (SEO settings are silently non-operational from the UI) + 1 high-severity input-validation gap (PATCH accepts empty key/value, corrupting data) + several medium/low gaps. Core content settings (General, Appearance, Contact, Payment, Legal, Messages, Homepage sections) work correctly and are properly access-controlled.

| # | Area | Result | Severity |
|---|------|--------|----------|
| 1 | Save + persistence (PATCH) | PASS | — |
| 2 | Auth/role on settings API | PASS | — |
| 3 | Real effect — General/Homepage/Hero | PASS | — |
| 4 | Real effect — Appearance (logo) | PASS | — |
| 5 | Real effect — Contact (email/social) | PASS | — |
| 6 | Real effect — Payment (bkash/instructions) | PASS | — |
| 7 | Real effect — Legal (privacy/terms) | PASS | — |
| 8 | Real effect — Messages (empty-state) | PASS | — |
| 9 | Public config mirror `/api/config` | PASS (with dead keys) | — |
| 10 | **SEO settings effect (title/description)** | **FAIL** | **HIGH / Critical** |
| 11 | **PATCH input validation (empty key/value)** | **FAIL** | **HIGH** |
| 12 | CSRF protection (prod) | N/A (disabled in dev) | MED (note) |
| 13 | DB export access control | PASS (super-admin only) | — |
| 14 | UploadThing access control | PARTIAL (any authed user) | LOW |
| 15 | Dead/unreachable settings | FAIL | MED |
| 16 | Cache invalidation after change | PASS (immediate, except SEO) | — |

---

## Critical / High Findings

### FINDING 10 — SEO settings are non-functional from the UI (HIGH / Critical)
**Symptom:** Changing `seo_title` / `seo_description` / `seo_keywords` / `seo_author` in the General tab has **no effect** on `<title>`, meta description, or OpenGraph tags.

**Root cause (two stacked bugs):**
1. `AdminSettingsPage.handleSave` PATCHes SEO keys with **`group: null`** (never sets `group: 'seo'`).
2. `src/app/layout.tsx:46-66` — `getSeoSettings()` reads SEO only via `db.siteSetting.findMany({ where: { group: 'seo' } })`. Because the UI stores these rows with `group: null`, the metadata builder never picks them up.
3. Secondary: even if group were correct, `getSeoSettings` is wrapped in `unstable_cache(..., { revalidate: 300 })` (5-minute cache), so changes wouldn't appear for up to 5 min.

**Evidence:** DB row `seo_title` had `group=null`. After manually `PUT`ting `seo_title` with `group:'seo'` and waiting past the cache window, the homepage `<title>` still did not update (cache + the fact the title is built at request time from the stale cache). The dedicated seed route `src/app/api/admin/settings/seed/route.ts` *does* set `group:'seo'` correctly — but it is a manual, undocumented step not wired into the save flow.

**Impact:** Admin cannot set the site's SEO title/description through the UI. For a content platform this is a real production defect.

**Fix direction:** Either (a) have `getSeoSettings` read by **key** (`seo_title`, `seo_description`, …) instead of by `group`, or (b) make `handleSave` send `group:'seo'` for SEO keys. Also reduce/eliminate the 300s cache or call `invalidateContentCache` on SEO change.

---

### FINDING 11 — PATCH accepts empty/unvalidated key & value (HIGH)
**Symptom:** `PATCH /api/admin/settings` accepts `value:""` (blanks a setting) and `key:""` (creates a corrupt `{key:""}` row).

**Root cause:** `src/app/api/admin/settings/route.ts:104-128`. PATCH validates only the top-level `{ settings: [...] }` array shape, then directly `db.siteSetting.upsert({ where: { key: s.key }, ... })` with **no per-item Zod validation**. Contrast POST (line 44) and PUT (line 72) which call `validateBody(createSettingSchema)` (enforces `min(1)`).

**Evidence (reproduced):**
- `PATCH {settings:[{key:"siteName",value:""}]}` → **200** (should be 400).
- `PATCH {settings:[{key:"",value:"x"}]}` → **200**, created a corrupt row with `key:'""'` that **breaks JSON serialization** of the `map` in `GET /api/admin/settings` (empty-string property key → `ConvertFrom-Json` fails / produces invalid JSON for clients).

**Impact:** An admin (or any caller who bypasses the UI) can blank critical settings or poison the settings table, breaking the GET response for the entire admin panel. Integrity + availability risk.

**Fix direction:** Validate each item with `z.array(createSettingSchema)` (or a relaxed `key:string().min(1)`, `value:string()` — but reject empty `key`). Reject empty `key` explicitly.

---

## Medium / Low Findings

### FINDING 15 — Dead / unreachable settings (MEDIUM)
- **`contactAddress`**: `ContactTab` has no field for it; `handleSave` never writes it. `/api/config` (route.ts:95) returns `contactAddress` but only from the `defaultConfig` fallback (`''`) since the UI can never set it. Effectively a dead setting.
- **`homepageTeachersTitle` / `homepageTeachersSubtitle`**: returned by `/api/config` (route.ts:135-136) and read from `homepage_teachers_title` / `homepage_teachers_subtitle` keys, but `UIContentTab` provides **no input** for them. Admin cannot set the Teachers section title.

### FINDING 14 — UploadThing not role-restricted (LOW)
`src/lib/uploadthing/core.ts` middleware only calls `verifyAuth` (session check), not a role check. Any authenticated user can hit `/api/uploadthing` directly to upload images/PDFs/media. The Appearance tab is admin-only, so practical exposure is limited, but the upload endpoint itself does not enforce admin role.

### FINDING 12 — CSRF disabled in dev (NOTE, not a defect now)
`withCsrf` is a no-op when `NODE_ENV==='development'`. Confirm CSRF is enforced in production before launch. Not verified (dev-only).

---

## What WORKS (verified)

- **Persistence:** PATCH of 40 fixed keys persists and reflects in `GET /api/admin/settings` and `/api/config`.
- **Access control:** Unauthorized GET → 401; Student GET → 403; Student PATCH → 403; Student DB export → 403; Admin export → 200. `withAdmin` / `requireSuperAdmin` active.
- **Malformed body:** `PATCH` with non-JSON body → 400.
- **POST/PUT validation:** POST requires `min(1)` value (empty → 400 `VALIDATION_ERROR`); POST duplicate → 409; PUT missing key → 404; PUT requires value; DELETE → 405 (no handler).
- **Real effects confirmed:** heroTitle, homepage_mcq_title, logo, facebook/youtube social, contactEmail, bkash + payment instructions, privacy/terms page content, msg_noQuestionsFound message — all render on the live site / public config.
- **XSS safety:** Script payloads stored but React escapes on render (safe).
- **Cache invalidation:** Non-SEO content changes reflected on homepage within ~2s (React Query `invalidate` + `invalidateContentCache('settings')`).

---

## Test Data Restoration
All test mutations were reverted. Final DB state: `siteName='শিক্ষা বাংলা'`, `seo_title=''`, all other probed keys at original/default values, **0 garbage rows** (66 total settings rows). No harness `.ps1` files remain.

---

## Recommended Actions (priority order)
1. **[HIGH]** Fix SEO: read SEO by key (not `group`) in `getSeoSettings`, and/or set `group:'seo'` on save. Remove/shorten the 300s `unstable_cache`.
2. **[HIGH]** Add per-item validation to PATCH handler; reject empty `key`/`value`.
3. **[MED]** Wire `contactAddress` and `homepageTeachersTitle/Subtitle` into the UI (ContactTab / UIContentTab) or remove them from `/api/config`.
4. **[LOW]** Add role check to UploadThing middleware (admin-only for logo/favicon).
5. **[NOTE]** Verify CSRF is enabled in production build.
