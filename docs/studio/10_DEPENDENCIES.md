# Studio Dependency Engine

JS-002 — Detect architectural issues from catalog + graph evidence.

## Detected rules

| Rule | Severity | Evidence |
|------|----------|----------|
| `circular_dependency` | Error | Cycle walk on `depends_on` / `consumes` edges |
| `duplicate_service` | Warning | Same service name in ≥2 catalog entries |
| `duplicate_entity` | Warning | Same entity / twin mapping name ≥2 times |
| `orphaned_module` | Info | Package node with no edges |
| `unused_api` | Warning | API with zero tests and zero docs |
| `missing_documentation` | Info | API with no documentation links |
| `missing_tests` | Warning | API or service with no linked tests |
| `dead_export` | Info | Service export never seen in import set |
| `missing_insight_provider` | Warning | Pack without Insight Provider entry |

## Risk score

```
riskScore = min(100, Σ severityWeight)
```

| Severity | Weight |
|----------|--------|
| Info | 1 |
| Warning | 3 |
| Error | 8 |
| Critical | 15 |

## API

`GET /api/studio/dependencies`

Supports `severity`, `rule`, `q`, `page`, `pageSize`, `force=1`.
Returns `riskScore`, `circularDependencies`, paginated `issues`, and severity counts.
