# D2 Implementation Summary — QuickBooks Online Production Connector

**Date:** 2026-07-13  
**Branch:** `sprint-047-performance` (or current)  
**Status:** Complete  

## What shipped

Production QuickBooks connector under `src/lib/platform/integrations/connectors/quickbooks/`:

| File | Role |
|------|------|
| `metadata.ts` | Non-placeholder catalog v1.0.0 |
| `entities.ts` | 18 object types |
| `auth.ts` | OAuth sandbox/production + company session |
| `client.ts` | `QuickBooksClient` + demo SoR with pagination |
| `normalize.ts` | Canonical mapping + required lineage fields |
| `store.ts` | Org-scoped cache + monitoring |
| `connector.ts` | Full `Connector` contract |
| `intelligence-feed.ts` | Soft lights for existing domains |
| `index.ts` | Public exports |

## Platform wiring

- Removed QuickBooks from placeholder loop  
- Registered `createQuickBooksConnector(deps)` with AcademyOS + Square  
- Re-exported from `integrations/index.ts`  
- Process singleton already bootstraps `quickbooks` in phase-1 list  

## ECC composition

| Helper / loader | Change |
|-----------------|--------|
| `ensure-quickbooks.ts` | Bootstrap + initial sync; returns `freshlySynced` |
| `quickbooks-feed.ts` | Resolve feed + live/cached mode |
| `data-mode.ts` | Added `cached` mode |
| `DataModeBadge` | Live / Cached / Synthetic styling |
| `load-home/brief/health/opportunities/risks` | Prefer QB for GL metrics |

## Tests

`tests/unit/integrations/quickbooks/connector.test.ts` — auth, OAuth, normalize, sync, pagination, incremental, disconnect/reconnect, feed, errors.

## Docs

- `docs/product/QUICKBOOKS_CONNECTOR.md`
- This summary

## Performance notes

- Demo sync is in-process (no network); duration recorded on store monitoring.  
- Warm process singleton avoids re-bootstrap of all connectors per request (D1).  
- First cold QB sync cost is paid once per process when ECC ensure runs.

## Explicit non-changes

- Intelligence packages untouched  
- OIOS dependency graph untouched  
- ECC architecture unchanged (composition only)  
- No public business API contract changes  

## Validation

```bash
npx tsc --noEmit
npm test
npm run build
npx madge --circular --extensions ts,tsx src/lib/platform/integrations/connectors/quickbooks
```
