# Enterprise Integration Platform — B4.1

**Status:** Platform scaffold complete (placeholder vendor I/O)  
**Location:** `src/lib/platform/integrations/`  
**UI:** `/exec/integrations`

## Principle

External systems remain systems of record. JAG synchronizes, normalizes, validates, persists **connector metadata**, emits events, and later feeds intelligence — without owning SoR CRUD.

## Pipeline

```
External System → Connector → Authentication → Synchronization
  → Normalization → Validation → Persistence → Event Bus
  → Intelligence Services (future adapters) → Executive Command Center
```

Every connector implements the shared `Connector` contract and runs through this flow.

## Adding a connector (minutes)

1. Add `connectors/<vendor>/metadata.ts` (`ConnectorMetadata`).
2. Export from `connectors/<vendor>/index.ts`.
3. Register metadata in `connectors/registry.ts` (uses `createPlaceholderConnector`).
4. Replace placeholder `sampleRecords` / auth with live API calls when ready — **do not** fork sync/auth/DLQ infrastructure.

## Common infrastructure

| Area | Module |
|------|--------|
| Contract | `common/contracts` |
| Auth (OAuth2 / API key / SA / refresh / credential store) | `common/auth` |
| Sync (cursors, modes, retry, rate limit, webhook, schedule) | `common/sync` |
| Normalization | `common/normalization` |
| Validation | `common/validation` |
| Persistence (history, health, audit, DLQ, metrics) | `common/persistence` |
| Event bus | `common/events` |
| Health / monitoring | `common/health`, `common/monitoring` |
| Platform composition | `common/services` |

## Phase 1 connectors (placeholder)

Google Workspace, Microsoft 365, QuickBooks Online, Plaid, HubSpot, BambooHR, AcademyOS, Stripe, CSV Import.

Scaffold folders also present: Salesforce, Gusto, Square, OFX.

## Non-goals (this task)

- Deep vendor business logic / live OAuth token exchange against vendor APIs  
- Changes to intelligence packages, OIOS graph, public intelligence APIs, registry, wisdom, collective, institutional memory  

## Executive Integration Center

`/exec/integrations` shows connected systems, status, health, last sync, imported counts, errors, Sync Now, Reconnect, catalog, search/filter.
