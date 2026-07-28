# Policy Engine

Configurable governance rules evaluated from repository evidence.

## Default policies

| ID | Rule |
|----|------|
| `policy.coverage.min` | Minimum test coverage / pass rate (70%) |
| `policy.docs.required` | Documentation coverage complete |
| `policy.a11y.review` | Accessibility review (AcademyOS) |
| `policy.perf.baseline` | Performance baseline evidence |
| `policy.security.validation` | Security validation / no critical findings |
| `policy.arch.no_cycles` | No circular dependencies |

Policies may be scoped to `productIds` or apply globally. Upsert via API to customize.

## Evaluation

`evaluatePolicies({ productId })` returns per-policy pass/fail, score, evidence, and aggregate `compliancePercent` / `passedRequired`.

## API

- `GET /api/studio/policies` — list
- `GET /api/studio/policies?productId=` — compliance report
- `POST` — upsert policy
