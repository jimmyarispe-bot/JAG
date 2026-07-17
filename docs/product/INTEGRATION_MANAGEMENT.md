# Integration Management — B4.2

**Status:** Complete  
**Depends on:** B4.1 Enterprise Integration Platform  
**Location:** `src/lib/platform/integrations/management/`  
**UI:** `/exec/integrations` and `/exec/integrations/[instanceId]`

## Principle

Connectors only implement the shared `Connector` contract.  
**Registration, configuration, auth, validation, connect, sync, scheduling, queueing, health, retries, pause/resume, disconnect/remove, and audit** are owned by Integration Management.

## Services

| Service | Responsibility |
|---------|----------------|
| `ConnectionManager` | Full lifecycle orchestration |
| `ConnectorRegistryService` | Catalog registration lookup |
| `CredentialManager` | Auth / refresh / credential audit |
| `SyncScheduler` | Manual / scheduled / realtime / poll; next sync |
| `SyncQueueService` | Ordered sync job queue |
| `SyncHistoryService` | Sync outcomes query |
| `ConnectorHealthMonitor` | Expanded health + notifications |
| `RetryManager` | Retry schedule / recover / exhaust |
| `IntegrationAuditService` | Lifecycle audit trail |

## Lifecycle

`register → configure → authenticate → validate → connect → initial sync → incremental sync → monitor → retry → pause ↔ resume → disconnect → remove`

Convenience: `connections.bootstrap()` runs the happy path through initial sync.

## Health states

`healthy` · `warning` · `degraded` · `offline` · `auth_required` · `rate_limited` · `error` · (`unhealthy` retained for compatibility) · `unknown`

## Notifications (event bus)

Sync failures, authentication expiration, API quota warnings, connector offline / recovered, pause / resume / remove, retry scheduled / succeeded / exhausted.

## Persistence (metadata only)

Configuration, lifecycle, schedules, sync history, health history, error history, retry history, queue, audit, metrics.

## Executive Integration Center

- List: status, health, last/next sync, pause/resume, details link, sync history, audit, events  
- Detail: configuration, auth status, API/rate limits, version, health history, sync history, retries, audit  

## Adding a future connector

1. Implement `Connector` contract (or placeholder factory).  
2. Register in connector registry.  
3. Call `management.connections.bootstrap({ connectorId, scope })` — management handles the rest.
