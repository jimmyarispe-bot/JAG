# 02 — Domain Lifecycle

In-memory lifecycle controller. **No persistence** — hosts may wrap this with durable install records.

---

## States

```text
declared → installed → initialized → active
                              ↘ inactive
                 ↘ upgrading ↗
any (except removed) → removed
```

| State | Meaning |
|-------|---------|
| `declared` | Manifest known (optional pre-install) |
| `installed` | Accepted into lifecycle |
| `initialized` | Ready to activate |
| `active` | Contributors registered on Runtime host |
| `inactive` | Not registered / deactivated |
| `upgrading` | Swapping package version |
| `removed` | Tombstoned |

---

## Operations

| API | Effect |
|-----|--------|
| `install(domain)` | Validate + enter `installed` |
| `initialize(id)` | `installed` → `initialized` |
| `activate(id)` | Register adapter onto host API → `active` |
| `deactivate(id)` | Optional `adapter.unregister` → `inactive` |
| `upgrade(id, next)` | Validate next; swap; re-activate if was active |
| `remove(id)` | Unregister if needed → `removed` |

---

## Host requirements

```ts
createDomainLifecycle({
  registrationApi: runtime.registry.asDomainAdapterApi(),
  runtimeVersion: "1.0.0-rc",
  coreVersion: "1.0.0-rc",
});
```

Activation calls `domain.adapter.register(registrationApi)` — the **only** write path into Runtime contributor maps.

---

## Explicit non-goals

- Auto-discovery of domain packages
- Database-backed install tables (host concern)
- Hot-reload of Core
