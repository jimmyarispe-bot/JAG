# JAG Process Engine

**Universal, industry-agnostic process orchestration for The JAG OS.**

Packages register **process definitions**. JAG owns **runtime execution**.  
No education, healthcare, or domain logic lives in this engine.

## Layout

| Path | Responsibility |
|------|----------------|
| `contracts/` | Immutable types + extension ports |
| `registry/` | Definition registration, uniqueness, dependencies |
| `runtime/` | `ProcessRuntime` — start / resume / complete / cancel / suspend / restore |
| `execution/` | `StageRuntime` — enter / execute / validate / leave (isolated) |
| `lifecycle/` | Extensible before/after hooks |
| `events/` | Process event emission + history |
| `permissions/` | Declarative permission checks |
| `persistence/` | Repository **interfaces only** (no SQL) |
| `telemetry/` | Start / stage / duration / completion contracts |
| `testing/` | Deterministic test helpers |

## Public entry

```ts
import {
  ProcessRegistry,
  ProcessRuntime,
  StageRuntime,
  registerLifecycleHook,
  bindProcessExtensions,
} from "@/jag/processes";
```

## Rules

1. Packages configure; JAG executes.
2. Extensions (workflows, forms, entities, documents, communications, intelligence, navigation) are called **only** through `ProcessExtensionPorts`.
3. Persistence drivers are out of scope — bind later via `ProcessRepository` ports.
4. Compatibility: `registerJagProcessDefinition` → `registerProcess`.

## Docs

`docs/jag-os/processes/`
