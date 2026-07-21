# RC-5 — E-001 Authenticated Evidence

| Field | Value |
|-------|-------|
| **Defect** | E-001 / G-RC1-01 |
| **Status** | **Open** until seven role `storageState` files exist and journeys pass |

## Harness (delivered)

1. Persona env contract — `scripts/rc5/personas.ts` / `.env.example`
2. Playwright setup — `tests/acceptance/auth.setup.ts` → `playwright/.auth/{role}.json`
3. Authenticated journeys — `tests/acceptance/authenticated-journeys.spec.ts`
4. Project — `acceptance-auth` (`npm run test:acceptance-auth`)

## Required scenarios (mapped)

| Scenario | Role storageState | Paths |
|----------|-------------------|-------|
| Admissions → Billing | `school_leader` | admissions → students → scheduling → teacher → finance |
| Teacher day → parent visibility | `teacher` + `parent` | teacher/scheduling/students; portal progress/finance |
| Finance → Exec | `founder` | finance → FI → executive KPIs |
| Executive decision → audit | `ceo` | brief → exec → executive → admin/security |
| Student / Employee | `student` / `employee` | portal student*; employee + hr |

## How to close

```bash
# Set RC5_<ROLE>_EMAIL / RC5_<ROLE>_PASSWORD for all seven roles (staging vault)
npm run test:acceptance-auth
# Archive traces/screenshots from test-results/ into docs/operations/rc5/artifacts/
```

## This environment

No `RC5_*` persona passwords configured → journeys skipped; E-001 remains **open**.
