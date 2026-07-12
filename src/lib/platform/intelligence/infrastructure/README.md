# Intelligence Platform Infrastructure (Sprint 027)

Shared platform infrastructure used by every JAG intelligence module.

**Location:** `src/lib/platform/intelligence/infrastructure/`  
**DI entry:** `createIntelligencePlatform()`  
**Also attached on:** `createIntelligenceService().intelligencePlatform`

## Quick start

```ts
import { createIntelligencePlatform } from "@/lib/platform/intelligence/infrastructure";

const platform = createIntelligencePlatform();
await platform.initialize();

const result = await platform.run({
  scope: { organizationId: "org-1", schoolId: "school-1" },
});

console.log(result.status, result.moduleOrder, result.durationMs);

const health = await platform.checkHealth();
const diagnostics = await platform.collectDiagnostics();
```

## Via IntelligenceService

```ts
import { createIntelligenceService } from "@/lib/platform/intelligence";

const service = createIntelligenceService();
const platform = service.intelligencePlatform;

await platform.run({ moduleIds: ["founder", "executive-graph"] });
```

## Capabilities

| Capability | Component |
|------------|-----------|
| Module contract | `IntelligenceModule` |
| Automatic registration | `IntelligenceProvider` + `registerProviders` |
| Dependency ordering | `IntelligenceRegistry.resolveOrder` |
| Execution pipeline | `IntelligencePipeline` |
| Execution context | `IntelligenceExecutionContext` |
| Lifecycle management | `IntelligenceLifecycle` |
| Execution timing / metrics | `IntelligenceMetrics` |
| Cache support | `IntelligenceCache` |
| Telemetry events | `IntelligenceTelemetry` / `IntelligenceEvents` |
| Scheduling | `IntelligenceScheduler` |
| Configuration | `IntelligenceConfiguration` |
| Health monitoring | `IntelligenceHealth` |
| Diagnostics | `IntelligenceDiagnostics` |
| Module versioning | `IntelligenceVersioning` |

## Integrated modules (dependency order)

1. `organization-health`
2. `financial` → depends on organization-health
3. `founder` → organization-health, financial
4. `executive` → organization-health, financial, founder
5. `executive-graph` → organization-health, financial, founder, executive
6. `executive-decision` → executive-graph

Adapters wrap existing packages — they do **not** regenerate Sprint 021–026 code.

## DI overrides

```ts
const platform = createIntelligencePlatform({
  registerDefaults: false,
  providers: [createIntelligenceProvider("custom", [myModule])],
  cache: createIntelligenceCache(),
  clock: { now: () => fixedDate, createId: (p) => `${p}-test` },
});
```

## Architecture notes

- Leaf types live in `types.ts` / `contracts.ts` (no implementation imports).
- Domain routing (`IntelligenceDomainModule` / `IntelligenceDomainRegistry`) remains separate.
- Platform events are distinct from foundation `IntelligenceEventService`.
- No circular imports: adapters → existing modules; platform → adapters; create-service → platform.
