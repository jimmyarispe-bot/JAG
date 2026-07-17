# 07 — Bundle Analysis

| Field | Value |
|-------|--------|
| **Phase** | D |
| **Date** | 2026-07-17 |
| **Method** | Static inventory (`src/lib/performance/inventory.ts`) + Next build artifacts when available |

---

## Inventory mechanism

`buildBundleReport` / `buildRouteInventory` walk `src/app` and related trees for:

- `page.tsx` / `route.ts` counts  
- `"use client"` file counts  
- Coarse size signals for admin performance UI  

Admin surface: `/admin/performance`.

---

## Observations

| Signal | Observation |
|--------|-------------|
| Code splitting | App Router route segments provide baseline splitting |
| Explicit `next/dynamic` | Rare — large client widgets likely in main segment chunks |
| Compress | `next.config.ts` `compress: true` |
| Static assets | Long-cache `/_next/static` immutable headers |
| Images | AVIF/WebP preferred formats configured |

---

## Largest surfaces (qualitative)

| Surface | Why heavy |
|---------|-----------|
| Executive workspace | Multiple connector feeds + intelligence composition |
| Dashboard SIS / admissions | Wide tables + client interactivity |
| Presentation / marketing routes | Media-heavy (out of critical path for ops) |

Exact First Load JS numbers are recorded in the **build log** for the Phase D validation run (see completion report). Treat Next’s route table as source of truth per build.

---

## Recommendations

1. Dynamic-import chart/graph client islands on `/exec/graph`  
2. Keep server components as default for data tables  
3. Avoid reintroducing mega client shells
