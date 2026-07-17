# Navigation Assessment — Phase D

## Shells (predictability)

| Shell | Global nav | Sidebar | Top | Breadcrumbs | Tabs | Search |
|-------|------------|---------|-----|-------------|------|--------|
| Dashboard | Module list | Yes | `TopNav` | XES in some modules | Query-param module tabs | `/dashboard/search` |
| Portal | Horizontal links | No | Brand + a11y bar | Limited | — | — |
| Apply | Apply-specific | No | — | — | — | — |
| Exec | `EXEC_NAV` | Horizontal/side | — | — | — | Ask JAG |
| Cloud / Ops | Domain nav | Yes | — | — | — | — |
| Org platform | 4-item | Yes | — | — | — | — |

**Finding NAV-01 (High):** Five+ distinct navigation metaphors increase training cost and inconsistency (heuristic: consistency & standards).

---

## Issues

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| NAV-01 | High | Multi-shell IA inconsistency | Dashboard vs Portal vs Exec vs Cloud |
| NAV-02 | High | Exec Phase-2 items in nav without complete routes | `src/lib/exec/navigation.ts` |
| NAV-03 | High | Dual executive entry (`/exec` + `/dashboard/executive` + founder nav) | founders-navigation, exec nav |
| NAV-04 | Medium | Founder sidebar + platform trees extremely deep | Config, IHUB, AIN, AIP, CERT |
| NAV-05 | Medium | Module tabs via query params — shareable but easy to lose context | Admissions/Finance/HR tabs |
| NAV-06 | Medium | Portal horizontal overflow nav on small screens | `PortalShell` |
| NAV-07 | Low | Breadcrumbs not universal | XES only where adopted |
| NAV-08 | Low | Shortcuts / command palette absent as standard | Search page only |

---

## Role-relevant navigation

Permission filtering via `route-authorization` + sidebar module visibility is the right model. Residual risks:

- Founder-only sections still labeled by role language (`FOUNDER_DASHBOARD_NAV` comments).  
- Cloud/Ops users redirected from staff paths — good.  
- SpEd: no nav target.  
- Students: short nav — good minimalism if product complete; otherwise under-powered.

---

## Heuristic scores (navigation)

| Principle | Score (1–5) |
|-----------|------------|
| Consistency | 2 |
| Recognition over recall | 3 |
| Efficiency | 3 staff / 2 parent-mobile |
| User control (back/escape) | 3 (dialogs weak) |
