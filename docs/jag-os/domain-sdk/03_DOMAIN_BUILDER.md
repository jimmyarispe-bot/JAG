# 03 — Domain Builder

Fluent infrastructure for assembling a `DomainPackage` from contributors.

**No domain implementations live in the builder.**

---

## API

```ts
createDomainBuilder({
  id, name, displayName, version, description, owner,
  requiredRuntimeVersion, minimumCoreVersion,
})
  .withCapabilities("context", "cognition", "action")
  .withPermission("pack.action.run", { actionScoped: true })
  .registerContextContributor({ id: "pack.context", discover: () => [] })
  .registerIntentContributor({ id: "pack.intent", detect: () => [] })
  .registerCognitiveContributor({ id: "pack.cognition" })
  .registerExperienceContributor({ id: "pack.experience" })
  .registerActionContributor({
    id: "pack.action",
    actionIds: ["pack.run"],
    execute: (req) => ({ status: "succeeded" }),
  })
  .registerEvidenceContributor({ id: "pack.evidence" })
  .registerMemoryContributor({ id: "pack.memory" })
  .registerTwinContributor({ id: "pack.twin" })
  .build();
```

---

## Outputs

`DomainPackage` contains:

| Field | Content |
|-------|---------|
| `manifest` | Complete `DomainManifest` |
| `bundle` | Contributor instances by kind |
| `metadata` | Optional tags / attributes |
| `adapter` | `DomainAdapter` that registers the bundle |

`tryBuild()` returns validation errors without throwing. `build()` throws on failure.

---

## Auto-declaration

Calling `register*Contributor` also appends a matching `manifest.contributors` entry when missing, and adds the related capability to `supportedCapabilities`.

---

## Registration target

The produced adapter expects `DomainAdapterRegistrationApi` — typically:

```ts
runtime.registry.asDomainAdapterApi()
```
