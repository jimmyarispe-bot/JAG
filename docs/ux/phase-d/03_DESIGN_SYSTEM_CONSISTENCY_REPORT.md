# Design System Consistency Report — Phase D

## Established systems

| System | Location | Strengths | Weaknesses |
|--------|----------|-----------|------------|
| **WDS** | `src/components/workspace-design-system/` | Tables, charts, shell, tokens | Chart a11y uneven |
| **XES** | `src/components/experience-system/` | Forms, feedback, dialogs, layout | Low production adoption |
| **UI** | `src/components/ui/` | PageHeader, tabs, EmptyState | Tiny set; overlaps XES |
| **Tokens** | `globals.css` `@theme`, `tokens.ts` | Brand/sidebar palette | No semantic contrast pairs |
| **Branding** | `src/lib/branding/` | Org product name/colors | Role title strings residual |

Platform contract: **Partial (a11y primitives)** — no shared accessible primitive kit as default path.

---

## Component audit

| Element | Consistency | Evidence / gap |
|---------|-------------|----------------|
| Typography | Partial | Tailwind scale; page-level drift |
| Spacing | Partial | Mix of tight slate panels vs XES spacing |
| Colors | Partial | Brand tokens + many hardcoded slate/emerald |
| Buttons | Partial | No single Button primitive enforced |
| Inputs | **Inconsistent** | XES `FormField` vs ad-hoc HR/admissions |
| Tables | Good (WDS) | `DataTables` + overflow-x |
| Cards | Overused in places | Founder grids / hubs — density risk |
| Dialogs | Weak adoption | `ConfirmDialog` + unused `useFocusTrap` |
| Forms | **Split** | Showcase uses XES; production often not |
| Icons | Partial | `ModuleIcons` + inline SVG |
| Nav | Multiple shells | Dashboard / Portal / Exec / Cloud / Ops |
| Status / badges | Partial | WDS status + ad-hoc badges |
| Loading | Inconsistent | One route `loading.tsx`; many pulse divs |
| Empty | Duplicate | `ui/EmptyState` vs XES `EmptyState` |
| Errors / success | Inconsistent | Banners vs plain divs; no toast system |

---

## Findings

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| DS-01 | High | Production forms bypass accessible XES `FormField` | Showcase-only usage; `HrForms`, `LeadForm` |
| DS-02 | High | Duplicate EmptyState / feedback patterns | `ui/` vs `experience-system/feedback` |
| DS-03 | Medium | No enforced Button/Input primitives | Ad-hoc class strings |
| DS-04 | Medium | ConfirmDialog not platform standard for destructive actions | Limited to AI flow |
| DS-05 | Medium | Color/contrast tokens lack WCAG semantic pairs | `globals.css`, `tokens.ts` |
| DS-06 | Low | Internal showcase exists but not Storybook/docs for contributors | `/dashboard/workspace-design-system` |

**Recommendation (D.1):** Adopt XES forms/feedback/dialogs as default for new edits; migrate highest-traffic forms; do **not** invent a third system.
