# Studio API

All routes require a Platform session and `organizationId`.

| Route | Methods |
|-------|---------|
| `/api/studio/products` | GET, POST |
| `/api/studio/releases` | GET, POST, PATCH |
| `/api/studio/per` | GET, POST, PATCH |
| `/api/studio/repository` | GET |
| `/api/studio/testing` | GET, POST |
| `/api/studio/architecture` | GET |
| `/api/studio/docs` | GET |
| `/api/studio/insights` | GET, POST (`action=install`) |
| `/api/studio/graph` | GET |
| `/api/studio/catalog` | GET |
| `/api/studio/dependencies` | GET |
| `/api/studio/recommendations` | GET |
| `/api/studio/search` | GET |
| `/api/studio/impact` | GET, POST |
| `/api/studio/certification` | GET, POST |
| `/api/studio/governance` | GET |
| `/api/studio/quality` | GET, PATCH |
| `/api/studio/policies` | GET, POST |
| `/api/studio/approvals` | GET, POST |
| `/api/studio/knowledge` | GET |
| `/api/studio/knowledge/search` | GET |
| `/api/studio/knowledge/node/[id]` | GET |
| `/api/studio/knowledge/path` | GET |
| `/api/studio/knowledge/impact` | GET |
| `/api/studio/knowledge/reason` | GET |
| `/api/studio/knowledge/health` | GET |
| `/api/studio/knowledge/recommendations` | GET |
| `/api/studio/knowledge/coverage` | GET |
| `/api/studio/knowledge/release-readiness` | GET |

Insights GET supports `?dashboard=1` and `?evaluate=1`.

### JS-002 query notes

| Route | Notes |
|-------|-------|
| `/api/studio/graph` | `dashboard=1`, `summary=1`, `nodeId` + dependents/dependencies, `kind`/`q`/`page`/`pageSize` |
| `/api/studio/catalog` | `meta=1`, `kind`/`q`/`ownerPackage`, pagination, `force=1` |
| `/api/studio/dependencies` | `severity`/`rule`/`q`, pagination, `force=1` |
| `/api/studio/recommendations` | `severity`/`q`, pagination, `force=1` |
| `/api/studio/search` | required `q`; optional `kinds`, `limit`, `force=1` |
| `/api/studio/impact` | required `target`; optional `changeKind` |
| `/api/studio/releases` | also `artifacts=1`, `gates=1` + `targetStage` |
| `/api/studio/certification` | `productId`; POST `action=refresh\|sign` |
| `/api/studio/approvals` | `workflow=1`; POST role/decision |
| `/api/studio/quality` | `productId` or `weights=1`; PATCH weights |
| `/api/studio/policies` | `productId` for compliance; POST upsert |
| `/api/studio/knowledge` | `dashboard=1` / `health=1`, `force=1`, pagination |
| `/api/studio/knowledge/search` | required `q` |
| `/api/studio/knowledge/node/[id]` | URL-encode id; neighbors/deps/docs/tests |
| `/api/studio/knowledge/path` | required `from`, `to` |
| `/api/studio/knowledge/impact` | required `targetId` |
| `/api/studio/knowledge/reason` | required `q` |
| `/api/studio/knowledge/health` | optional `productId`, `dashboard=1` |
| `/api/studio/knowledge/recommendations` | `productId`, `severity`, pagination |
| `/api/studio/knowledge/coverage` | product/package/module/service coverage |
| `/api/studio/knowledge/release-readiness` | `productId`, `targetStage` (default RC-3) |
