# 01 — Runtime Kernel Implementation

**Phase Ω-1** · Package: `src/lib/jag/runtime`  
**Authority:** [00_RUNTIME_OVERVIEW.md](../00_RUNTIME_OVERVIEW.md) · [07_RUNTIME_PIPELINE.md](../07_RUNTIME_PIPELINE.md)

---

## Architecture

The Runtime Kernel is the **execution framework** for the JAG Cognitive Runtime. It coordinates lifecycle, pipeline stages, registration, events, errors, and telemetry.

It does **not** contain domain business logic, UI, widget composition, intent detection, cognitive reasoning, or education-specific code.

```text
createJagRuntime()
  ├── registry   (domain packages, extensions, stages, providers)
  ├── events     (typed bus: publish / subscribe / middleware)
  ├── telemetry  (lifecycle hooks only — no external provider)
  ├── pipeline   (Identity → … → Twin skeleton)
  └── context    (per-run RuntimeContext + AbortSignal)
```

### Directory map

| Path | Role |
|------|------|
| `kernel/` | `createJagRuntime`, lifecycle |
| `context/` | Per-run execution context |
| `contracts/` | Framework-agnostic TypeScript interfaces |
| `events/` | Typed event bus |
| `registry/` | Registration APIs |
| `pipeline/` | Stage orchestration + skeleton stages |
| `types/` | Stage ids, opaque ids |
| `errors/` | Unified error hierarchy |
| `telemetry/` | Lightweight instrumentation |

---

## Public APIs

```ts
import {
  createJagRuntime,
  RUNTIME_PIPELINE_STAGE_IDS,
  RUNTIME_KERNEL_EVENT_TYPES,
  type JagRuntime,
  type RuntimeContext,
  type RuntimeIdentity,
  type RuntimeIntent,
  type RuntimeExperience,
  type RuntimeAction,
  type RuntimeEvent,
  type RuntimeExtension,
  type RuntimePipelineStage,
  type RuntimeResult,
  type RuntimeEvidenceReference,
  type RuntimeMemoryReference,
  type RuntimeTwinReference,
} from "@/lib/jag/runtime";
```

### Lifecycle

```ts
const runtime = createJagRuntime({ runtimeId: "jag_local" });
await runtime.start();          // created → ready
const result = await runtime.run({ composeOnly: true });
runtime.cancel();               // abort in-flight run
await runtime.stop();           // clear registry/events → stopped
```

`run()` auto-starts when state is `created`.

### Pipeline options

| Option | Effect |
|--------|--------|
| `composeOnly` | Skip action → twin (Identity…Experience only) |
| `stopAfter` | Halt after named stage |
| `skipStages` | Mark stages skipped |
| `initialData` | Seed `ctx.state.data` (e.g. `actionId`) |
| `trigger` | Metadata for events/telemetry |

### Registry

```ts
runtime.registry.registerDomainPackage({ id, name, version? });
runtime.registry.registerExtension({ id, kind, onRegister?, onUnregister? });
runtime.registry.registerPipelineStage({ id, order?, optional?, execute });
runtime.registry.registerEventListener(id, eventType, handler, { priority? });
runtime.registry.registerExperienceProvider({ id, compose, supports? });
runtime.registry.registerActionProvider({ id, actionIds, execute });
```

**No industry pack is registered by default.** Education and others register themselves in later phases.

### Event bus

```ts
const unsub = runtime.events.subscribe("jag.runtime.runtime.pipeline_completed", handler, { priority: 10 });
runtime.events.use(async (event, next) => { await next(event); });
await runtime.events.publish(type, payload, { correlationId });
unsub();
```

### Telemetry

```ts
runtime.telemetry.subscribe((event) => { /* lifecycle only */ });
runtime.telemetry.recent();
```

---

## Pipeline stages (skeleton)

```text
identity → context → intent → cognition → experience
  → action → domain → evidence → memory → twin
```

Default stages are **no-ops** except:

- **experience** — invokes the highest-priority matching `ExperienceProvider` if any  
- **action** — if `initialData.actionId` is set, dispatches to an `ActionProvider`

Override any stage via `registerPipelineStage`.

---

## Contracts (selected)

| Contract | Meaning |
|----------|---------|
| `RuntimeContext` | Per-run execution context (correlation, signal, state) |
| `RuntimeOrganizationalContext` | Context **stage** output (situation), not execution context |
| `RuntimeIdentity` | Identity stage output (generic; pack attrs in `attributes`) |
| `RuntimeIntent` | Intent stage output |
| `RuntimeExperience` | Experience composition descriptor (no UI) |
| `RuntimeAction` | Action result |
| `RuntimeEvidenceReference` / `Memory` / `Twin` | Publication refs |
| `RuntimeResult` | Pipeline outcome |
| `RuntimeExtension` | Extension descriptor |
| `RuntimePipelineStage` | Pluggable stage |

---

## Error hierarchy

```text
RuntimeError
  ├── RuntimeRecoverableError
  │     └── RuntimeCancellationError
  ├── RuntimeFatalError
  ├── RuntimeAuthorizationError
  ├── RuntimeContextError
  ├── RuntimeIntentError
  ├── RuntimePipelineError
  └── RuntimeExtensionError
```

- Fatal / non-recoverable errors abort the pipeline.  
- Recoverable errors on **optional** stages (action→twin by default) allow continuation.  
- Cancellation via `AbortSignal` / `runtime.cancel()`.

---

## Extension points

1. Replace pipeline stages  
2. Register experience / action providers  
3. Register domain packages and generic extensions  
4. Subscribe to kernel or custom events  
5. Attach telemetry sinks  

Domain logic belongs in packages/engines invoked by later subsystem adapters — **not** in the Kernel.

---

## Examples

### Compose-only run

```ts
const runtime = createJagRuntime();
const result = await runtime.run({
  composeOnly: true,
  trigger: { kind: "page.load" },
});
// result.stages: identity…experience completed; action…twin skipped
```

### Custom identity stage

```ts
runtime.registry.registerPipelineStage({
  id: "identity",
  execute(ctx) {
    ctx.setIdentity({
      principalId: "auth-1",
      effectiveUserId: "user-1",
      roles: [],
      permissions: ["workspace.read"],
      orgAssignments: [{ organizationId: "org-1" }],
      activeOrganizationId: "org-1",
      issuedAt: new Date().toISOString(),
    });
  },
});
```

### Experience provider (no React)

```ts
runtime.registry.registerExperienceProvider({
  id: "shell.minimal",
  compose({ organizationalContext }) {
    return {
      workspaceId: "ws",
      contextId: organizationalContext?.contextId ?? "default",
      widgetIds: [],
      commandEnabled: true,
      searchEnabled: true,
    };
  },
});
```

---

## Tests

`tests/unit/jag/runtime/kernel.test.ts` covers creation, lifecycle, pipeline order, stage/extension/event registration, failure propagation, and result typing.

---

## Out of scope (this phase)

- Experience Runtime widget composition / UI  
- Intent detection, Context discovery, Cognition engines  
- Action/domain business logic  
- Education pack registration  
- Moving or rewriting existing engines  
- API routes / React components
