# Frontend Performance & Rendering Audit

**Project:** Sikkha - Online Learning Platform  
**Framework:** Next.js 16 + React 19 + Tailwind CSS  
**Date:** 2026-07-19  

---

## Frontend Performance Score: 78/100

## Rendering Score: 82/100

## Bundle Score: 75/100

---

## Executive Summary

The frontend uses Next.js App Router with good Suspense coverage (121 usages) and proper lazy loading for admin pages (40+ pages). However, 251 components are marked 'use client' (many could be server components), the root layout nests 5 providers causing re-render cascades, and several heavy dependencies (recharts, framer-motion, tiptap, katex, xlsx) inflate the bundle.

---

## 1. Server Components vs Client Components

### Assessment: WARNING

| Category | Count | Assessment |
|----------|-------|------------|
| Total components | 251+ | — |
| 'use client' components | 251 | WARNING — many could be server components |
| Server components | ~15 (pages, layout) | PASS — but limited |

**Issues:**
- `HomePage.tsx` is marked 'use client' but renders 17 child components — could be a server component with client sub-components
- `AppShell.tsx` is 'use client' — wraps entire layout
- `Header.tsx`, `Footer.tsx` are 'use client' — could be partially server-rendered
- Most admin pages are correctly 'use client' (interactive)

**Impact:** Client components cannot be streamed by the server, increasing TTFB for initial render.

---

## 2. Provider Nesting (Re-render Risk)

### Assessment: WARNING

**Root Layout Provider Chain:**
```
<html>
  <ThemeProvider>          // 1. Theme (client)
    <QueryProvider>        // 2. React Query (client)
      <AuthProvider>       // 3. Auth (client)
        <LearningPreferenceProvider>  // 4. Learning (client)
          <LoadingProvider>  // 5. Loading (client)
            {children}
```

**Issue:** 5 nested providers, each creating a new context. When any provider's state changes, all children re-render.

**Specific risks:**
- `LoadingProvider` re-renders on every `isLoading`/`progress`/`message` change
- `LearningPreferenceProvider` re-renders on `learningMode`/`classLevel` changes
- `AuthProvider` re-renders on `user`/`isAuthenticated` changes

**Fix:** Merge AuthProvider and LearningPreferenceProvider into a single context.

---

## 3. Lazy Loading & Code Splitting

### Assessment: PASS

**Admin pages:** All 40+ admin pages use `lazy()` — excellent code splitting:
```ts
const AdminPages = {
  'admin-dashboard': lazy(() => import('./AdminDashboardPage')),
  'admin-users': lazy(() => import('./AdminUsersPage')),
  // ... 40+ more pages
}
```

**Suspense coverage:** 121 Suspense wrappers across all pages — consistent loading states.

**MathJax:** Loaded via `strategy="lazyOnload"` — doesn't block initial render.

**Issue:** All analytics routes point to the same `AnalyticsPage` component — no code splitting between analytics sub-pages.

---

## 4. Heavy Dependencies

### Assessment: WARNING

| Dependency | Size (est.) | Used In | Assessment |
|-----------|-------------|---------|------------|
| recharts | ~200KB | Analytics charts | WARNING — 16 chart components |
| framer-motion | ~150KB | Animations, transitions | WARNING — used in admin layout, modals |
| @tiptap/react | ~180KB | Rich text editor | WARNING — only used in admin editors |
| katex | ~300KB | Math rendering | WARNING — loaded on every page |
| markmap-lib + view | ~200KB | Mind maps | WARNING — rarely used |
| xlsx | ~400KB | Excel import/export | WARNING — only admin bulk import |
| isomorphic-dompurify | ~50KB | HTML sanitization | PASS — needed |
| embla-carousel | ~30KB | Carousels | PASS — small |
| recharts (optimizePackageImports) | — | Configured | PASS |

**Issues:**
- `katex` is loaded on every page via MathJax CDN script — should be lazy
- `xlsx` is 400KB but only used in admin bulk import — should be dynamically imported
- `markmap` is ~200KB but rarely used — should be dynamically imported
- `recharts` has `optimizePackageImports` configured — good

---

## 5. Image Optimization

### Assessment: WARNING

| Pattern | Count | Assessment |
|---------|-------|------------|
| `<Image>` usage | 130+ | — |
| `unoptimized` prop | ~40 | WARNING — bypasses Next.js optimization |
| Missing width/height | ~10 | WARNING — causes CLS |
| External URLs (utfs.io) | ~80 | PASS — configured in next.config.ts |

**Issues:**
- Many `<Image>` components use `unoptimized` prop — defeats Next.js image optimization
- Some images lack explicit width/height — causes Cumulative Layout Shift
- UploadThing URLs are external — Next.js image optimization works but requires proper config

**next.config.ts image config:** Properly configured with remotePatterns, formats (avif, webp), deviceSizes, imageSizes, and 86400s cache TTL.

---

## 6. Memory Leak Risks

### Assessment: WARNING

| Component | Pattern | Cleanup | Risk |
|-----------|---------|---------|------|
| `HeroSection` | `mousemove` listener | useEffect cleanup | LOW |
| `HeroSection` | `resize` listener | useEffect cleanup | LOW |
| `Header` | `scroll` listener | useEffect cleanup | LOW |
| `AppShell` | `online`/`offline` listeners | useEffect cleanup | LOW |
| `NoticeBar` | `setInterval` | useEffect cleanup | LOW |
| `ExamCountdownSection` | `setInterval` | useEffect cleanup | LOW |
| `ExamSessionPage` | `setInterval` x2 | useEffect cleanup | LOW |
| `StudentShowcaseSection` | `setInterval` + `resize` | useEffect cleanup | LOW |
| `TestimonialsSection` | `setInterval` | useEffect cleanup | LOW |
| `LoadingMessages` | `setInterval` | useEffect cleanup | LOW |
| `AdminBulkImportPage` | `setInterval` (progress) | useRef cleanup | LOW |
| `CQExamViewerPage` | `setInterval` + `setTimeout` | useRef cleanup | LOW |
| `MCQExamPackageDetailPage` | `setInterval` x2 + `setTimeout` | useRef cleanup | LOW |
| `SearchBar` | `mousedown` listener | useEffect cleanup | LOW |

**Assessment:** All event listeners and timers appear to have proper cleanup in useEffect return functions. No obvious memory leaks detected.

---

## 7. Re-render Analysis

### Assessment: WARNING

**High re-render risk components:**

| Component | Issue | Impact |
|-----------|-------|--------|
| `AdminLayout` | Imports 46 lucide icons directly | Each icon is a separate module |
| `LearningPreferenceProvider` | Context with 6 values | All consumers re-render on any change |
| `LoadingProvider` | Context with 11 values | Re-renders on loading state changes |
| `AdminLayout` | `useSearchParams()` in component | Re-renders on any URL change |
| `HomePage` | 17 child components, all 'use client' | Full client-side render |

**Mitigations already in place:**
- `useCallback` used in LoadingProvider functions
- `useMemo` used for context values
- `useShallow` used in auth store selectors
- `mountedRef` pattern prevents state updates on unmounted components

---

## 8. Hydration Issues

### Assessment: PASS

- `suppressHydrationWarning` on `<html>` and `<body>` — correct for theme switching
- `Header` uses `mounted` state pattern to avoid hydration mismatch
- No `typeof window` checks detected (good — uses proper patterns)
- ThemeProvider with `attribute="class"` handles server/client theme mismatch

---

## 9. Error Boundaries

### Assessment: WARNING

| Location | Coverage | Assessment |
|----------|----------|------------|
| `AppShell.tsx` | Content area only | WARNING — no page-level boundaries |
| `error.tsx` | Root error page | PASS |
| `global-error.tsx` | Global error page | PASS |
| `AdminLayout` | No error boundary | WARNING — admin crash = white screen |

**Issue:** Only 1 ErrorBoundary component exists. Admin pages have no error boundaries — a crash in any admin page will show a white screen.

**Fix:** Add error boundaries around each lazy-loaded admin page.

---

## 10. Core Web Vitals Impact

### LCP (Largest Contentful Paint)
- **Risk:** MEDIUM — HeroSection loads images from external CDN (utfs.io)
- **Mitigation:** Preconnect to utfs.io configured, image formats optimized
- **MathJax script:** Loaded via CDN `lazyOnload` — doesn't block LCP

### CLS (Cumulative Layout Shift)
- **Risk:** MEDIUM — Some `<Image>` components lack width/height
- **Mitigation:** Most images have explicit dimensions
- **BannerCarousel:** Uses `fill` layout — proper for carousels

### FID/INP (Interaction to Next Paint)
- **Risk:** LOW — No heavy synchronous operations detected
- **Mitigation:** Debounced search inputs, throttled scroll handlers

### TTFB (Time to First Byte)
- **Risk:** MEDIUM — `force-dynamic` on root layout means every request hits server
- **Mitigation:** React Query prefetches config data server-side

---

## 11. Bundle Analysis

### Total Component Size: 3.4MB (TypeScript source)

### Largest Components (>20KB):
| Component | Size | Assessment |
|-----------|------|------------|
| AdminExamsPage | ~120KB | WARNING — should split |
| AdminCQExamPackagesPage | ~117KB | WARNING — should split |
| AdminNoticePage | ~90KB | WARNING — should split |
| AdminPackagesPage | ~85KB | WARNING — should split |
| AdminMCQExamPackagesPage | ~90KB | WARNING — should split |
| AdminKnowledgeQuestionsPage | ~75KB | WARNING |
| AdminVersionHistoryPage | ~80KB | WARNING |
| AdminAuditLogsPage | ~65KB | WARNING |
| AdminPaymentsPage | ~60KB | WARNING |
| AdminUsersPage | ~60KB | WARNING |

**All admin pages are lazy-loaded** — these sizes are per-chunk, not initial bundle.

---

## 12. Font Optimization

### Assessment: PASS

```typescript
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" })
```

- Two fonts loaded (Geist Sans + Geist Mono) — reasonable
- `display: "swap"` prevents FOIT (Flash of Invisible Text)
- Fonts are self-hosted via Next.js font optimization

---

## 13. Specific Page Analysis

### HomePage
- **17 sections** all rendered as client components
- **No virtualization** — all sections render at once
- **BannerCarousel** uses embla-carousel — lightweight
- **EnhancedStatsSection** uses recharts — heavy but lazy-loaded via analytics

### AdminLayout
- **40+ lazy-loaded pages** — excellent code splitting
- **46 lucide icons** imported directly — could use tree-shaking
- **framer-motion** used for sidebar animation — adds ~150KB
- **ScrollArea** for sidebar navigation — proper overflow handling

### Exam Pages
- **ExamSessionPage** has 2 `setInterval` timers — properly cleaned up
- **CQExamViewerPage** has complex state management — well-structured
- **MCQExamPackageDetailPage** has countdown + auto-start timers — properly managed

---

## Files Requiring Optimization

| Priority | File | Issue | Fix |
|----------|------|-------|-----|
| HIGH | `src/app/layout.tsx:5` | `force-dynamic` on root layout | Remove if possible, use page-level dynamic |
| HIGH | `src/components/home/HomePage.tsx` | All 17 sections are 'use client' | Convert static sections to server components |
| HIGH | `src/components/admin/AdminLayout.tsx` | 46 lucide icons imported directly | Use dynamic imports for icons |
| MEDIUM | `src/providers/LearningPreferenceProvider.tsx` | 6-value context causes re-renders | Split into smaller contexts |
| MEDIUM | `src/providers/LoadingProvider.tsx` | 11-value context | Split loading state from actions |
| MEDIUM | Admin pages >80KB | Large lazy chunks | Split into sub-components |
| MEDIUM | `next.config.ts` | Missing CSP header | Add Content-Security-Policy |
| LOW | Multiple Image components | Missing width/height | Add explicit dimensions |
| LOW | `src/components/shared/ErrorBoundary.tsx` | Only 1 error boundary | Add per-page boundaries |

---

## Summary

| Area | Score | Notes |
|------|-------|-------|
| Server/Client Split | 70/100 | Too many client components |
| Lazy Loading | 90/100 | Admin pages properly lazy-loaded |
| Suspense Usage | 88/100 | Consistent across all pages |
| Error Boundaries | 65/100 | Only 1 error boundary |
| Image Optimization | 75/100 | Many `unoptimized` images |
| Memory Safety | 90/100 | All timers/listeners cleaned up |
| Re-render Management | 78/100 | Provider nesting causes cascades |
| Bundle Size | 75/100 | Heavy dependencies (katex, xlsx) |
| Hydration | 92/100 | Proper patterns used |
| Font Optimization | 95/100 | Self-hosted with swap |
| Core Web Vitals | 80/100 | CLS from missing image dimensions |

**Overall: 78/100**
