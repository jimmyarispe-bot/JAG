# 03 — Context Runtime Implementation

**Phase Ω-3** · Package: `src/lib/jag/runtime/context`  
**Authority:** [02_CONTEXT_RUNTIME.md](../02_CONTEXT_RUNTIME.md) · Pipeline: [07_RUNTIME_PIPELINE.md](../07_RUNTIME_PIPELINE.md)

---

## Constitutional gate

| Question | Answer |
|----------|--------|
| Domain knowledge? | **No** |
| Duplicate context/state systems? | **No** — situational Runtime context; distinct from React/app state |
| Bypass Runtime? | **No** — Context pipeline stage after Identity |
| UI? | **No** |
| Education-specific concepts? | **No** |

---

## Architecture

```text
RuntimeIdentity
    ↓
ContextProvider[] (registered)
    ↓ discover / enrich
ContextResolver (merge + inherit)
    ↓
ContextStore (persistent / temporary / snapshots)
    ↓
ContextSnapshot
    ↓ toOrganizationalContext()
Kernel RuntimeContext.state.organizationalContext
    ↓
Intent → …
```

### Naming

| Type | Meaning |
|------|---------|
| `RuntimeContext` | Kernel **execution** context (correlation, signal, stage bag) |
| `ContextSnapshot` | Situational context from Context Runtime |
| `RuntimeOrganizationalContext` | Kernel contract projection of the snapshot |

---

## Context model

`ContextSnapshot` is universal:

- organization, workspace (opaque id)
- focus object / workflow / task refs (type + id only)
- temporal + collaborative metadata
- domainHints (opaque pack ids)
- persistent vs temporary mode
- inheritance (`parentContextId`, `depth`)

The Runtime **never** interprets students, invoices, admissions, or other domain types.

---

## Lifecycle

1. **Discover** — merge provider contributions; filter by org membership + permissions  
2. **Resolve** — select profile, inherit parent, enrich  
3. **Activate** — store persistent and/or temporary overlay  
4. **Switch / enter / exit** — update active situation  
5. **Snapshot / restore** — capture and reinstate store state  
6. **Pipeline bind** — map onto `organizationalContext` for Intent+

Temporary overlays persistent; clearing temporary restores persistent.

Cancellation: pipeline `AbortSignal` aborts resolve via `RuntimeCancellationError`.

---

## Public APIs

```ts
import {
  createContextRuntime,
  installContextRuntime,
  CONTEXT_EVENT_TYPES,
  type ContextProvider,
  type ContextSnapshot,
} from "@/lib/jag/runtime";

const jag = createJagRuntime();
jag.registry.registerContextProvider(provider);
installIdentityRuntime(jag);
installContextRuntime(jag);

await jag.run({
  composeOnly: true,
  stopAfter: "context",
  initialData: { sessionRef: "…", contextId: "ops.home" },
});
```

| Method | Purpose |
|--------|---------|
| `discover` | List available contexts |
| `resolve` / `resolveOrThrow` | Build active snapshot |
| `switch` | Persistent context change |
| `setTemporary` / `clearTemporary` | Overlay |
| `setFocus` | Update focus object |
| `enter` / `exit` | Nested temporary stack |
| `createSnapshot` / `restoreSnapshot` | Capture / restore |

---

## Extension model

```ts
runtime.registry.registerContextProvider({
  id: "pack.example",
  discover(identity) { return [/* AvailableContext */]; },
  enrich?(identity, snapshot) { return snapshot; },
});
```

Core does not register Education or any domain pack.

---

## Events

| Event | When |
|-------|------|
| `jag.runtime.context.resolved` | Successful resolve |
| `jag.runtime.context.changed` | Persistent switch |
| `jag.runtime.context.entered` | Temporary set / enter |
| `jag.runtime.context.exited` | Temporary cleared |
| `jag.runtime.context.snapshot_created` | Snapshot stored |
| `jag.runtime.context.restored` | Snapshot restored |
| `jag.runtime.context.resolution_failed` | Empty / failure |

---

## Examples

### Nested inheritance

Child `AvailableContext.parentContextId` → resolver merges parent domainHints, workspace, and attributes; increments `depth`.

### Pipeline seed

```ts
initialData: {
  contextId: "ops.home",
  workspaceId: "ws-1",
  contextSelection: { focusObject: { type: "object", id: "x" } },
}
```

---

## Tests

`tests/unit/jag/runtime/context.test.ts`

---

## Out of scope

React · UI · routes · navigation · dashboards · AcademyOS objects · Education concepts · DB schema · business logic
