# Prioritized UX & Accessibility Improvement Roadmap — Phase D → D.1

**Rule:** Observe/document in Phase D. Implement only after approval (`proceed Wave D.1`).  
**Rule:** No new product features in D.1 — close UX/a11y/consistency gaps only.

---

## Wave D.1 — Critical / High (unblock AA path + major friction)

| Order | ID | Action | Evidence of done |
|-------|-----|--------|------------------|
| 1 | A11Y-01 | Wire `useFocusTrap` into all dialogs; focus restore on close | Keyboard modal test pass |
| 2 | A11Y-02 | Global `prefers-reduced-motion` in `globals.css` | Motion disabled in OS setting |
| 3 | A11Y-03 | Platform `focus-visible` styles on interactive elements | Visible ring keyboard-only |
| 4 | A11Y-04 / DS-01 | Migrate top forms (HR, Lead, parent apply) to XES `FormField` | Labels + `aria-*` + errors |
| 5 | A11Y-05 | Chart text alternatives (table or detailed label) for BarChart | SR announces data |
| 6 | A11Y-06 | Shared `LoadingState` / route `loading.tsx` for top modules | `aria-busy` present |
| 7 | A11Y-07 | App-level live region or toast for async errors/success | Consistent announcements |
| 8 | NAV-02 | Hide or disable Exec Phase-2 nav until routes exist | No dead links |
| 9 | NAV-03 / WF-03 | Document + UX clarify dual exec surfaces (or soft-link one primary) | CEO path unambiguous |
| 10 | CQ-01 | Remove misleading “i18n-ready” until locale ships | Honest copy |
| 11 | RD-01 | Real device/responsive QA on parent + teacher + finance top flows | Checklist signed |
| 12 | A11Y-08 | Skip links on portal + login | Bypass block works |
| 13 | DS-02 | Consolidate EmptyState to one primitive | Single import path |
| 14 | WF-01 | **SpEd:** out of scope for pure UX polish — track as product gap; do not fake nav | Explicit backlog item |

## Wave D.2 — Medium

- Contrast token pairs + automated contrast CI sample  
- Portal-style text-size/contrast prefs optional on staff  
- Table mobile alternatives for top 3 parent/teacher views  
- Breadcrumbs standard in XES shells  
- Content terminology glossary (Students/SSIS, HR/Workforce)  
- ConfirmDialog for destructive finance/HR actions  
- Heuristic pass on founder IA information scent  

## Wave D.3 — Hardening / i18n / mobile product

- i18n framework + message extraction (when product prioritizes)  
- RTL layout audit  
- Currency/date locale from org settings  
- Native mobile decision (PWA for portal vs RN) — product, not silent D.1  
- Full axe + NVDA/VoiceOver certification run → update compliance report  

---

## Heuristic evaluation summary (Nielsen)

| Principle | Score (1–5) | Driver |
|-----------|------------:|--------|
| Visibility of system status | 3 | Sparse loading/toasts |
| Match real-world language | 3 | Jargon in exec/platform |
| User control & freedom | 2 | Dialog focus; dead nav |
| Consistency & standards | 2 | Multi-shell + dual DS |
| Error prevention | 3 | Confirm underused |
| Recognition over recall | 3 | Deep trees |
| Efficiency of use | 3 | Staff OK; mobile weak |
| Aesthetic & minimalist design | 2 | Dense dashboards/admin |
| Help users recover from errors | 2 | Generic errors |
| Help & documentation | 2 | Cert/docs ahead of UI help |

---

## Approval gate

Phase D documentation gates are **met**.  
Reply **`proceed Wave D.1`** to implement P0 UX/a11y remediations only.
