# Knowledge Impact Analysis

Given a proposed change target (package, module, service, API, …):

```
Package X changes
  → APIs
  → Products
  → Tests
  → Docs
  → PERs
  → Releases
```

## Algorithm

1. Resolve `targetId` (exact id, label, or `kind:name` suffix).
2. BFS reachability to `maxDepth` (default 3) over undirected neighbor + dependent edges.
3. Partition reachable nodes by kind.
4. Union with direct `findTests` / `findDocumentation` / `findPERs`.
5. Emit sorted unique lists + summary string.

## API

`GET /api/studio/knowledge/impact?targetId=package:academyos&maxDepth=3`

Related (JS-002): `/api/studio/impact` remains available for catalog-level impact; Knowledge Graph impact is the richer relationship-aware report.
