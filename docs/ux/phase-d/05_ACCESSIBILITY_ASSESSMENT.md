# Accessibility Assessment — Phase D

**Target:** WCAG 2.2 AA  
**Method:** Code review + certification engine inspection (not full axe/Lighthouse suite)

---

## Strengths

- Skip-to-main on `DashboardShell`, `ExecShell`
- Login form: labels, autocomplete, `aria-required`, `role="alert"`
- XES `FormField`: `htmlFor`, `aria-describedby`, error `role="alert"`
- WDS tables: `sr-only` captions
- Portal accessibility bar (contrast, text size, reduce motion) — portal only
- DonutChart: `role="img"` + `aria-label`
- Permission-based route gating reduces inappropriate UI exposure

---

## Critical / High gaps

| ID | Severity | Area | Finding | Evidence |
|----|----------|------|---------|----------|
| A11Y-01 | Critical | Dialogs | `useFocusTrap` defined but **never used**; `ConfirmDialog` lacks trap | `experience-system/interaction/index.tsx` |
| A11Y-02 | High | Motion | No CSS `prefers-reduced-motion` globally | Repo-wide zero matches |
| A11Y-03 | High | Focus | `focus-visible` only in ~5 files | Most controls use `focus:ring` or none |
| A11Y-04 | High | Forms | Production HR/admissions forms miss label wiring / live errors | `HrForms.tsx`, `LeadForm.tsx` |
| A11Y-05 | High | Charts | Bar charts lack ARIA / data table alternative | `Charts.tsx`, `ProgressVisualizationPanel.tsx` |
| A11Y-06 | High | Loading | Most pulse loaders lack `aria-busy` / status | Module `*PageContent.tsx` |
| A11Y-07 | High | Feedback | No toast/live region standard for async errors | No sonner/hot-toast |
| A11Y-08 | Medium | Skip links | Missing on portal, login, cloud/ops | Shell comparison |
| A11Y-09 | Medium | Contrast | No tokenized AA contrast validation | `globals.css` |
| A11Y-10 | Medium | Certification | Engine marks most WCAG checks as warning/manual | `accessibility-engine.ts` |

---

## Dimension checklist

| Dimension | Status |
|-----------|--------|
| Keyboard navigation | Partial — dialogs/focus incomplete |
| Screen readers | Partial — charts/forms gaps |
| Semantic HTML | Partial — varies by module |
| ARIA | Partial (~66 files; incomplete) |
| Heading hierarchy | Untested systematically |
| Focus management | **Fail** (trap unused) |
| Visible focus | **Weak** |
| Color contrast | Untested / unenforced |
| Text scaling / zoom | Portal large-text only |
| Reduced motion | Portal JS only |
| Accessible forms | Login/XES yes; production uneven |
| Accessible tables | WDS captions good |
| Accessible charts | Donut yes; bar no |
| Accessible dialogs | Structure yes; trap no |

---

## Role impact

| Role | A11y risk |
|------|-----------|
| Parents (portal) | Best mitigations (a11y bar); still chart/form gaps |
| Teachers / HR / Finance | Dense tables; weak forms; no a11y bar |
| CEO | Exec charts/dashboards visual-heavy |
| Students | Thin UI but same portal patterns |
