# Responsive Design Assessment — Phase D

## Strategy

**Responsive web only.** No Expo/React Native. Mobile certification records viewport matrix as **manual warnings** (`accessibility-engine.ts` → `runMobileCertification` score ~65 placeholder).

PWA manifests: Cloud + Operations only — not family/staff portals.

---

## Breakpoint coverage

| Class of UI | Desktop / laptop | Tablet | Mobile | Notes |
|-------------|------------------|--------|--------|-------|
| Dashboard shell | Strong | OK | Drawer + overlay | `DashboardShell`, `Sidebar` |
| Portal nav | OK | Horizontal scroll | Scroll / cramped | `PortalShell` `overflow-x-auto` |
| Data tables | Strong | Scroll-x | Scroll-x (no card reflow) | `DataTables` |
| Forms | Mixed | Stack usually OK | Touch targets uneven | Ad-hoc forms |
| Dashboards / charts | Dense | Crowded | Hard to read | Bar charts visual-only |
| Dialogs | OK | OK | Focus trap missing | Risk on small screens |
| Exec / Cloud / Ops | Nav-heavy | Cramped | Limited testing evidence | Manual cert only |

---

## Checklist results

| Check | Result | Severity if fail |
|-------|--------|------------------|
| Navigation usable on small screens | Partial (drawer staff; portal scroll) | High |
| Tables usable | Scroll only | Medium |
| Forms usable | Partial | High |
| Dashboards readable | Dense | High |
| Charts readable | Weak on mobile | High |
| Dialogs / touch | Partial | High |
| Touch targets ≥44px | Not systematically enforced | Medium |
| Portrait / landscape | Not automated | Medium |
| Scrolling / sticky headers | Ad-hoc | Low |

---

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| RD-01 | High | No automated device matrix; cert engine always warns |
| RD-02 | High | Parent/teacher phone UX = dense tables + long nav |
| RD-03 | Medium | Tables lack mobile card/list alternative |
| RD-04 | Medium | Portal accessibility bar not on staff surfaces |
| RD-05 | Low | Loading skeletons inconsistently responsive |

**Evidence:** Extensive `sm:`/`md:`/`lg:` usage (100+ files); single `loading.tsx` at `dashboard/jag/loading.tsx`.
