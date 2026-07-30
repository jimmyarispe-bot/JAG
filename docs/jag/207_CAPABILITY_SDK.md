# Sprint 207 — Intelligence Capability SDK

**Status:** Complete (Phase II)  
**Scope:** Application architecture only. Does not change JAG Core behavior.

---

## 1. Objective

Every intelligence capability registers itself once.  
The Executive Workspace discovers navigation, search, conversation, briefings, watchers, and health automatically.

Route: `/jag/capabilities`

---

## 2. Package

```
src/lib/platform/capabilities/
  CapabilityManifest.ts
  CapabilityRegistry.ts
  CapabilityLoader.ts
  CapabilityLifecycle.ts
  CapabilityHealth.ts
  CapabilityDependency.ts
  CapabilityProvider.ts
  CapabilityVersion.ts
  CapabilityPermissions.ts
  CapabilityMetadata.ts
  CapabilityService.ts
  bootstrap.ts
  observability.ts
  manifests/intelligence.ts
  index.ts
```

---

## 3. Manifest schema

Each `CapabilityManifest` includes:

| Field | Purpose |
|-------|---------|
| id / name / version | Identity |
| description / category | Catalog |
| routes / navigation | Discovery surfaces |
| permissions | Required / optional |
| dependencies | Version ranges (optional allowed) |
| providers | search, conversation, briefing, watcher, observability, health |
| featureFlags | Capability toggles |
| metadata | tags, owner, sprint, docs |
| enabled | Lifecycle gate |

---

## 4. Provider contracts

- **Search** — `listItems()`
- **Conversation** — `intents[]` + description
- **Briefing** — `sectionIds[]`
- **Watcher** — `watcherTypes[]`
- **Observability** — surface label
- **Health** — `check()` → healthy | warning | unavailable | initializing

Providers are optional. Absence is valid.

---

## 5. Lifecycle

`registered` → `initializing` → `ready` | `degraded` | `failed` | `disabled`

Registration is idempotent. Re-register may emit `version_change`.

---

## 6. Registration (DX)

1. Author a `CapabilityManifest` (+ providers)  
2. Register via `CapabilityRegistry.register` / include in bootstrap manifests  
3. Done — navigation, search, and explorer discover automatically  

No manual UI wiring for capability routes.

---

## 7. Dependency model

Validation detects:

- Missing capability  
- Version mismatch  
- Circular dependency  
- Disabled dependency  
- Watcher provider conflicts  

---

## 8. Workspace discovery

`CapabilityLoader` builds:

- Navigation (shell + capability nav)  
- Search items  
- Conversation / briefing / watcher provider indexes  
- Health dashboard  
- Capability explorer (`CapabilityService.explorer`)  

Phase II modules registered in `manifests/intelligence.ts`.
