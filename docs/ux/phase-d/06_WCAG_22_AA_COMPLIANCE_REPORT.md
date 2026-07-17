# WCAG 2.2 AA Compliance Report — Phase D

**Verdict:** **Not compliant** for AA certification.  
**Estimated posture:** ~40–55% of AA criteria likely met on highest-traffic flows; remainder unproven or failing.

Certification UI at `/dashboard/certification/accessibility` records mostly **warnings** via `runAccessibilityCertification()` — not evidence of pass.

---

## Criterion matrix (sampled)

| Criterion | Name | Status | Evidence / gap |
|-----------|------|--------|----------------|
| 1.1.1 | Non-text content | Fail/Partial | Bar charts lack text alternative |
| 1.3.1 | Info & relationships | Partial | Forms without label association (HR) |
| 1.4.3 | Contrast (Minimum) | Unknown | No automated contrast audit |
| 1.4.4 | Resize text | Partial | Portal large-text; staff unproven |
| 1.4.11 | Non-text contrast | Unknown | Charts/icons |
| 1.4.12 | Text spacing | Untested | — |
| 1.4.13 | Content on hover/focus | Untested | Tooltips via `title` on bars |
| 2.1.1 | Keyboard | Partial | Focus trap unused |
| 2.1.2 | No keyboard trap | Risk | Modals without trap/return focus |
| 2.4.1 | Bypass blocks | Partial | Skip links dashboard/exec only |
| 2.4.3 | Focus order | Untested | — |
| 2.4.7 | Focus visible | **Fail/Weak** | Sparse `focus-visible` |
| 2.5.8 | Target size (min) | Untested | Touch targets not enforced |
| 3.2.3 | Consistent navigation | Partial | Multiple shells |
| 3.3.1 | Error identification | Partial | LeadForm no `role="alert"` |
| 3.3.2 | Labels or instructions | Partial | Login pass; HR fail |
| 3.3.3 | Error suggestion | Weak | Generic messages |
| 3.3.4 | Error prevention | Partial | ConfirmDialog limited use |
| 4.1.2 | Name, Role, Value | Partial | Engine self-reports partial ARIA |
| 2.3.3 | Animation from interactions | **Fail** | No global reduced-motion |
| 2.4.11 / 2.4.12 (2.2) | Focus not obscured / appearance | Untested | — |
| 3.2.6 / 3.3.7 / 3.3.8 (2.2) | Consistent help / redundant entry / accessible auth | Partial | Login OK; broader unproven |

---

## Compliance blockers (must fix for AA claim)

1. Focus management for all dialogs/modals (trap + restore).  
2. Global visible focus styles + keyboard audit of top 20 workflows.  
3. `prefers-reduced-motion` for CSS animations.  
4. Accessible name + error association on all production forms.  
5. Chart text alternatives (table or detailed `aria-label`).  
6. Contrast audit with documented AA pairs.  
7. Automated axe CI on critical routes + manual SR pass (NVDA/VoiceOver).

Until then: **do not claim WCAG 2.2 AA** in marketing or certification launch materials.
