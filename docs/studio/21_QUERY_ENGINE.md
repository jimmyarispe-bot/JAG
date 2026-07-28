# Query Engine

All queries are deterministic (sorted IDs, BFS with lexicographic neighbor order).

| Function | Behavior |
|----------|----------|
| `findNode(id)` | Exact id lookup |
| `findNeighbors(id, dir)` | Adjacent edges/nodes |
| `findPath(from, to)` | Undirected BFS shortest path |
| `findDependents(id)` | Incoming DEPENDS_ON/CONSUMES/USES/… |
| `findDependencies(id)` | Outgoing dependency edges |
| `findDocumentation(id)` | DESCRIBES/DOCUMENTS links |
| `findTests(id)` | VALIDATES links (+ package tests) |
| `findPERs(id?)` | All PERs or REFERENCES to target |
| `findProducts()` | Product layer nodes |
| `searchGraph({ q, kinds })` | Token score over id/label/keywords |

## API

- `GET /api/studio/knowledge/search?q=`
- `GET /api/studio/knowledge/node/{id}` (URL-encode ids with `:`)
- `GET /api/studio/knowledge/path?from=&to=`
