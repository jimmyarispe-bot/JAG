# JAG Domain SDK

Universal domain framework for plugging **any industry** into JAG without modifying Core.

```text
JAG Core (frozen)  ←  Domain SDK  ←  Domain packages (Education, Healthcare, …)
```

## Package

`src/lib/jag/domain-sdk`

Import:

```ts
import { createDomainSdk, createDomainBuilder } from "@/lib/jag/domain-sdk";
```

## What this is

| Module | Role |
|--------|------|
| `domain-manifest` | Required declaration schema |
| `domain-builder` | Fluent assembly of contributors |
| `domain-registry` | Installed domain catalog (no auto-load) |
| `domain-lifecycle` | install → activate → remove |
| `domain-validation` | Manifest, version, constitutional checks |
| `domain-version` | SDK / Runtime / Core compatibility |
| `domain-capabilities` | Industry-agnostic capability tokens |

## What this is not

- Not Education / AcademyOS
- Not domain business logic
- Not a Core fork
- Not UI

## Quick start

```ts
const domain = createDomainBuilder({
  id: "example.industry",
  name: "example-industry",
  displayName: "Example Industry",
  version: "1.0.0",
  description: "…",
  owner: { name: "Team" },
  requiredRuntimeVersion: "1.0.0-rc",
  minimumCoreVersion: "1.0.0-rc",
})
  .registerContextContributor({ id: "example.context", discover: () => [] })
  .registerCognitiveContributor({ id: "example.cognition" })
  .registerActionContributor({
    id: "example.action",
    actionIds: ["example.run"],
    execute: () => ({ status: "succeeded" }),
  })
  .withPermission("example.action.run")
  .build();

await domain.adapter.register(runtime.registry.asDomainAdapterApi());
```

## Docs

See [`docs/jag-os/domain-sdk/`](../../../docs/jag-os/domain-sdk/).

## Checklist

Every domain must also pass [`DOMAIN_ADAPTER_CHECKLIST.md`](../../../docs/jag-os/runtime/DOMAIN_ADAPTER_CHECKLIST.md).
