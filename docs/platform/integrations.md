# Integration Platform Core

**Sprint:** 073  
**Version:** 0.1.0  
**Package:** `src/lib/platform/integrations/`  
**Classification:** Platform Infrastructure (peer of Intelligence, Security, Identity, Observability)

## Architecture overview

The Integration Platform Core is the reusable foundation every connector uses. Connectors must not implement authentication, sync, scheduling, retry, rate limiting, normalization, events, registry, or observability independently.

```
Provider API
    │
    ▼
PlatformConnector (contract)
    │
    ├── Auth framework (OAuth2 / API key / SA / JWT / Basic)
    ├── Sync engine (manual / scheduled / incremental / full)
    ├── Scheduler + webhook processor
    ├── Retry + rate limit + circuit breaker
    ├── Normalization pipeline
    ├── Event bus
    ├── Lifecycle + telemetry + health
    └── Knowledge graph hooks
```

Platform registration with OIOS:

```
Platform
 ├── Intelligence      (intelligence DAG)
 ├── Integrations      ← this package (NOT on the DAG)
 ├── Security
 ├── Identity
└── Observability
```

## Package structure

```
integrations/
├── core/           # auth, oauth, sync, scheduler, retry, rate-limit, …
├── contracts/      # PlatformConnector and related interfaces
├── normalization/  # validation → map → dedupe → canonical entity
├── events/         # bus, publisher, subscriber, dispatcher
├── graph/          # entity/relationship builders (extension points)
├── services/       # createIntegrationPlatformCore + infrastructure registry
├── registry.ts
├── types.ts
└── index.ts
```

Existing B4.x vendor connectors under `common/`, `management/`, and `connectors/` remain supported and continue to use the Enterprise Integration Platform composition root.

## Connector lifecycle

Standard states:

`installing` → `authenticating` → `connected` → `syncing` → `healthy` | `warning` | `error` | `disabled` | `disconnected`

Transitions are enforced and audited by `LifecycleManager`. Invalid transitions throw.

## Authentication strategies

Adapters registered on `IntegrationAuthFramework`:

| Strategy | Adapter |
|----------|---------|
| OAuth2 | `createOAuth2Adapter` + `buildOAuthAuthorizeUrl` |
| API key | `createApiKeyAdapter` |
| Service account | `createServiceAccountAdapter` |
| JWT | `createJwtAdapter` |
| Basic | `createBasicAuthAdapter` |

Connectors select a strategy; they do not invent a parallel auth stack.

## Synchronization model

Modes: **manual**, **scheduled**, **incremental**, **full**.

- `IntegrationSyncEngine` runs every sync through rate limiting, retry, and circuit breaker policies.
- `IntegrationScheduler` emits due `SyncRequest`s; `runDueSchedules()` executes them.
- Webhooks enter through `IntegrationWebhookProcessor` and reuse the same sync lifecycle.

## Event system

Internal bus (`PlatformEventBus` / `createEventBus`) with pub/sub:

Examples: `PAYMENT_RECEIVED`, `EMAIL_RECEIVED`, `CALENDAR_UPDATED`, `DOCUMENT_CHANGED`, `USER_CREATED`, `MEETING_COMPLETED`, `SYNC_COMPLETED`, `CONNECTOR_FAILED`.

Producers publish; consumers subscribe. No direct coupling.

## Normalization pipeline

```
Provider payload
    → Validation
    → Normalization (field map)
    → Deduplication
    → Canonical entity
    → Knowledge graph hooks
```

Raw provider payloads never flow directly into JAG intelligence. Provider-specific field maps are supplied later by individual connectors.

## Telemetry & health

Every connector exposes:

- Connection status  
- Last successful / failed sync  
- Sync duration  
- Records processed  
- Error count  
- Rate-limit state  
- Circuit state  

Collected by `TelemetryCollector` and `buildHealthSnapshot`.

## Extension guide

### Register platform infrastructure

```ts
import { createOiosOperatingSystem } from "@/lib/platform/oios";

const oios = createOiosOperatingSystem();
oios.platformInfrastructure.require("integrations");
oios.integrations?.registerConnector(myConnector);
```

### Create the core platform

```ts
import {
  createIntegrationPlatformCore,
  createStubPlatformConnector,
} from "@/lib/platform/integrations";

const platform = createIntegrationPlatformCore();
platform.registerConnector(createStubPlatformConnector({ id: "demo" }));
await platform.syncNow("demo", "demo-instance", "full");
```

## Connector development guide

1. Implement `PlatformConnector` (`authenticate`, `refreshAuthentication`, `disconnect`, `validate`, `sync`, `health`, `metadata`).
2. Choose auth strategy adapters; do not fork auth.
3. Register with `platform.registerConnector(connector)` / `registerConnector(registry, connector)`.
4. Optionally supply field maps to `createNormalizationPipeline`.
5. Emit domain events through `platform.publisher` (e.g. `PAYMENT_RECEIVED`).
6. Use graph builders only after normalization — never from raw payloads.
7. Configure retry / rate-limit / circuit policies per connector via `createIntegrationPlatformCore({ policies })`.

### UI

Generic components under `src/components/integrations/`:

- `ConnectorCard`
- `ConnectorStatus`
- `ConnectionHealth`
- `SyncHistory`
- `IntegrationSettings`
- `InstallConnectorDialog`
- Collaboration ECC: `CommunicationHealth`, `ResponseTime`, `ActiveTeams`, `MeetingLoad` (Sprint 076)

## Non-goals (Sprint 073)

- Provider-specific connectors (Google Workspace, Microsoft, QuickBooks, etc.)
- Provider field mappings into the knowledge graph
- Adding Integrations to the intelligence DAG

See also: [Google Workspace](./google-workspace-connector.md), [Microsoft 365](./microsoft-365-connector.md), [Collaboration Platforms](./collaboration-platforms.md), [Financial Intelligence](./financial-intelligence-connectors.md), [Enterprise Connectors](./enterprise-connectors.md).

## Integration phase exit (Sprint 078)

The Integration Platform phase is complete when every connector uses Sprint 073 core infrastructure, normalizes before JAG, feeds the shared Knowledge Graph, supports a consistent lifecycle, and surfaces ECC insights without provider-specific details. See [Enterprise Connectors](./enterprise-connectors.md).

