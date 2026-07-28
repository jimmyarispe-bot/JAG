# Graph Health

JS-005 — Completeness and freshness of the JAG Knowledge Graph.

## Metrics

| Metric | Meaning |
|--------|---------|
| Relationship completeness | Density of VALIDATES/EXPOSES/DOCUMENTS/DEPENDS_ON vs services+APIs+modules |
| Orphan node count | Nodes with no edges (excl. roles) |
| Undocumented APIs | APIs without DOCUMENTS/DESCRIBES |
| Untested services | Services without VALIDATES/VALIDATED_BY |
| Disconnected modules | Modules with no edges |
| Stale documentation | Doc nodes older than ~180 days (by `updatedAt`) |
| Stale PER references | Open PERs or PERs missing AFFECTS |
| Graph freshness | fresh / warm / stale vs `builtAt` |
| Reasoning confidence | Share of High-confidence recommendations |
| Repository coverage | Packages represented among node owners |
| RC-3 readiness | Score from governance + graph evidence |

## Trend history

Snapshots are appended to an in-process trend (max 30) when version or edge count changes. Cleared with `resetStudioStoreForTests()`.

## Completeness methodology

```
relationshipCompleteness ≈ (validates + exposes + documents + depends)
                           / (2 × (services + apis + modules)) × 100
```

Capped at 100. Evidence-only — no manual edge lists.

## API

`GET /api/studio/knowledge/health`  
`GET /api/studio/knowledge?dashboard=1` (extended Studio dashboard)
