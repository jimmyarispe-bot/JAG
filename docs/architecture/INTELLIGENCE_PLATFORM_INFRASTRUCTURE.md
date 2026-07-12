# Intelligence Platform Infrastructure

**Sprint:** 027  
**Package:** `src/lib/platform/intelligence/infrastructure`  
**Version:** `0.1.0`

## Purpose

Provide one shared runtime substrate for all JAG intelligence product modules so they can register, declare dependencies, execute in a deterministic order, emit telemetry, cache results, report health, and expose diagnostics — without each module inventing its own plumbing.

## Separation of concerns

| Layer | Responsibility |
|-------|----------------|
| Domain routing (`IntelligenceDomainModule` / `IntelligenceDomainRegistry`) | Route cognitive run requests to domain packs (`success`, `executive`, …) |
| Platform infrastructure (this package) | Register and execute product intelligence modules (`founder`, `executive-graph`, …) |
| Product modules (Sprint 021–026) | Domain logic — wrapped by thin adapters, never regenerated here |

## Core contracts

### IntelligenceModule

Every platform module declares:

- `id`, `name`, `version`
- `dependencies[]` (module ids)
- `capabilities[]`
- `execute(context, input)`
- optional `initialize` / `shutdown` / `health`

### IntelligenceRegistry

- Validates and stores modules
- Rejects duplicates
- Resolves execution order via Kahn topological sort
- Detects missing and cyclic dependencies

### IntelligencePipeline

1. Build `IntelligenceExecutionContext`
2. Resolve dependency order
3. For each module: cache lookup → execute → store context result → record timing/metrics/events
4. Aggregate status: `completed` | `partial` | `failed`

### Cross-cutting services

- **Cache** — TTL entries, hit/miss counters
- **Metrics** — increment / gauge / timing samples
- **Telemetry / Events** — typed platform event bus
- **Lifecycle** — phase tracking + initialize/shutdown cascades
- **Scheduler** — interval jobs with `tick()`
- **Configuration** — typed key/value snapshot with defaults
- **Health** — per-module + aggregate status
- **Diagnostics** — health + versions + metrics + events + cache + config
- **Versioning** — module version records + compatibility checks

## Default dependency graph

```
organization-health
        ↓
    financial
        ↓
     founder
        ↓
    executive
        ↓
 executive-graph
        ↓
executive-decision
```

## DI entry points

```ts
createIntelligencePlatform(options?)
createIntelligenceService().intelligencePlatform
```

Override any collaborator (`registry`, `cache`, `metrics`, `providers`, …) for tests or specialized deployments.

## Non-goals

- Does not replace Sprint 012 Decision Intelligence domain resolver
- Does not replace Sprint 025/026 engines
- Does not own UI or persistence
