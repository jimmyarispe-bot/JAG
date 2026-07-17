# Integration Connector Registry (Sprint 020)

| Field | Value |
|-------|--------|
| **Document** | Connector Registry |
| **Module** | `@/lib/platform/integrations` |
| **Status** | Platform service — reusable by all products |

---

## Purpose

Canonical catalog for integration connectors: **register**, **enable/disable**, and **version**. Catalog state is distinct from per-organization connection instance `enabled` / `paused` flags.

---

## API

```ts
import {
  createIntegrationPlatform,
  createConnectorRegistry,
  registerAllConnectors,
} from "@/lib/platform/integrations";

const platform = registerAllConnectors(createIntegrationPlatform());

platform.register(connector);                    // validated; rejects duplicates
platform.register(connector, { replace: true }); // version upgrade
platform.disableConnector("hubspot");
platform.enableConnector("hubspot");
platform.getConnectorVersion("hubspot");         // "0.1.0"
platform.listCatalog({ enabledOnly: true });
```

| Method | Behavior |
|--------|----------|
| `register(connector, options?)` | Validates id, name, semver `version`, contract methods |
| `enableConnector` / `disableConnector` | Catalog-level availability |
| `getConnectorVersion` | Registered metadata version |
| `listCatalog({ enabledOnly, placeholder, category })` | Filtered discovery |
| `registry.requireEnabled(id)` | Throws `CONNECTOR_DISABLED` / `UNKNOWN_CONNECTOR` |

---

## Composition

```text
createConnectorRegistry()
        │
        ▼
createIntegrationPlatform({ registry? })
        │
        ▼
registerAllConnectors(platform)   # idempotent bootstrap
        │
        ▼
createIntegrationManagement(platform).registry  # management facade
```

`ensureInstance`, sync, authenticate, and connection registration reject **catalog-disabled** connectors.

---

## Errors

`ConnectorRegistryError` codes:

- `DUPLICATE_CONNECTOR`
- `UNKNOWN_CONNECTOR`
- `INVALID_CONNECTOR`
- `INVALID_VERSION`
- `CONNECTOR_DISABLED`

---

## Tests

```bash
npx vitest run tests/unit/integrations/connector-registry.test.ts
```
