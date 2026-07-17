# 03 — Frontend Performance

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |

---

## Applied

| Change | Effect |
|--------|--------|
| `src/app/exec/loading.tsx` | Instant Suspense fallback for executive workspace navigations |

Existing dashboard `loading.tsx` coverage already present for admissions, finance, HR, teacher, jag, portal.

---

## Baseline (unchanged)

| Signal | Observation |
|--------|-------------|
| App Router | Majority server components |
| `"use client"` in `src/app` | Sparse — islands mostly under `components/` |
| `next/dynamic` / `lazy()` in app | Essentially unused — opportunity |
| Virtualization | Not present on large tables |
| Hero/marketing surfaces | Out of Phase D scope |

---

## Recommendations (not applied)

1. Dynamic-import heavy client widgets on exec graph / integrations pages  
2. Virtualize student/lead tables once pagination lands  
3. Avoid expanding client shells; keep data fetching on the server  

---

## Bundle notes

See `07_BUNDLE_ANALYSIS.md`. Static inventory is available via `src/lib/performance/inventory.ts` and `/admin/performance`.
