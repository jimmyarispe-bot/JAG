# Content Quality Review — Phase D

Static sampling of labels, titles, and messaging patterns (not a full copy edit).

---

## Terminology

| Topic | Observation | Severity |
|-------|-------------|----------|
| Product naming | AcademyOS / JAG / Founders Edition / MICMS presentation coexist | Medium — brand clarity |
| Students vs SIS vs Student Success | Module label “Student Success (SSIS)” vs routes `/students` | Medium |
| Workforce vs HR | Nav “Workforce” → `/dashboard/hr` | Low |
| Executive vs Mission Control vs Ask JAG | Overlapping concepts | High for CEO users |
| Portal “Finance” vs staff Finance | Same word, different power | Medium — set expectations in copy |
| “i18n-ready” in portal bar | Implies localization that is not implemented | **High** — misleading |

---

## Voice & grammar

- Generally professional English.  
- Mix of marketing tone (exec “Wisdom”, “Ask JAG”) and ops tone (certification, connectors).  
- Error messages often generic (“Something went wrong” / slate boxes) — weak recovery guidance (**Medium**).  
- Required field indicators inconsistent (`*` placement) — **Medium**.

---

## UI copy checklist

| Element | Status |
|---------|--------|
| Button labels | Partial — “Save”/“Submit” OK; some icon-only risk |
| Page titles | Partial — `PageHeader` not universal |
| Instructions | Sparse on dense admin trees |
| Confirmations | ConfirmDialog underused |
| Empty states | Duplicate components; many plain “No records” |
| Success | Ad-hoc; no toast standard |

---

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| CQ-01 | High | Portal claims “i18n-ready” while UI is English-only |
| CQ-02 | High | Exec/nav labels for unfinished Phase-2 screens |
| CQ-03 | Medium | Cross-surface terminology drift (HR/Workforce, SSIS/Students) |
| CQ-04 | Medium | Generic error copy hurts error recovery heuristic |
| CQ-05 | Low | Presentation deck public without “demo” framing may confuse |

---

## i18n readiness (content systems)

| Concern | Status |
|---------|--------|
| Localization framework | **Missing** |
| Date/time/currency | Hardcoded `en-US` / USD (`src/lib/format.ts`) |
| RTL | **Missing** |
| Character encoding | UTF-8 OK (platform default) |
| Message catalogs | Nav `labelKey` hints only — not wired |
