# Frontend Performance Report — Phase C

| Field | Value |
|-------|-------|
| **Purpose** | Document React/Next rendering and UX performance risks |
| **Scope** | Dashboard, portal, apply, exec |
| **Audience** | Frontend eng |
| **Version** | 1.0.0 |

---

## Measurement status

| Metric | Status |
|--------|--------|
| FCP / LCP / TTI | **Not measured** (no Lighthouse CI) |
| Interaction latency | **Not measured** |
| Bundle size CI | **Not configured** |

---

## Findings

| ID | Sev | Finding | Evidence |
|----|-----|---------|----------|
| FE-01 | High | All `/dashboard` wrapped in client `DashboardShell` | `dashboard/layout.tsx` |
| FE-02 | High | Only one `loading.tsx` in app (~266 pages) | `dashboard/jag/loading.tsx` |
| FE-03 | Medium | ~120+ `"use client"` components | components tree |
| FE-04 | Medium | Almost no `next/dynamic` code-splitting | 1 usage found |
| FE-05 | Medium | Dense tables without virtualization | WDS DataTables |
| FE-06 | Low | Many `page.tsx` are Server Components | Positive |
| FE-07 | Low | Portal a11y bar client-side prefs | Portal only |

---

## Hydration / Suspense

- Suspense boundaries not systematically used for data regions.  
- Client shell forces hydration of nav/branding on every dashboard navigation.  
- Missing route-level loading UI → poor perceived performance.

## Related documents

- `docs/ux/phase-d/04_RESPONSIVE_DESIGN_ASSESSMENT.md`
- `10_PRIORITIZED_OPTIMIZATION_ROADMAP.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Static |
