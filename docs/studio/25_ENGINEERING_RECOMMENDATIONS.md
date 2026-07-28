# Engineering Recommendations

JS-005 — Evidence-backed work items from the Knowledge Graph (not generic heuristics).

## Required fields

Each recommendation includes:

- severity (`Info` | `Warning` | `Error` | `Critical`)
- confidence (`High` | `Medium` | `Low`)
- affected products / packages / services
- supporting graph evidence (edge absences, node ids, gate/policy ids)
- estimated engineering impact (`Low` | `Medium` | `High`)
- score for prioritization

## Sources

| Source | Example |
|--------|---------|
| Untested services | No `VALIDATED_BY` edges |
| Weak APIs | No `VALIDATES` from tests |
| Undocumented APIs | No `DOCUMENTS` edges |
| RC-3 blockers | Gate/policy/cert/graph merge |
| Orphan PERs | No `AFFECTS` edges |

## Scoring

```
score = severityBase + boost
severityBase: Info=15, Warning=45, Error=75, Critical=95
RC-3 blockers: +20
```

## API

`GET /api/studio/knowledge/recommendations?productId=academyos`
