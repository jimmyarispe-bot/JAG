# JAG Documents Engine

**Universal, industry-agnostic document lifecycle for The JAG OS.**

Packages register **document definitions**. JAG owns runtime lifecycle, versioning, and classification.  
Storage providers are adapters — not part of this engine core.

## Layout

| Path | Responsibility |
|------|----------------|
| `contracts/` | Immutable types + extension ports |
| `registry/` | Definitions, categories, templates |
| `runtime/` | `DocumentRuntime` — create / version / archive / restore / link / validate |
| `storage/` | Repository + storage provider **interfaces only** |
| `templates/` | Template registration surface |
| `versions/` | Immutable history helpers |
| `classification/` | Universal classification labels |
| `permissions/` | Declarative permission checks |
| `events/` | Document event log |
| `telemetry/` | Telemetry emission contracts |
| `testing/` | Deterministic helpers |

## Public entry

```ts
import {
  DocumentRegistry,
  DocumentRuntime,
  bindDocumentExtensions,
} from "@/jag/documents";
```

## Rules

1. No education/healthcare domain fields.
2. No SQL or cloud storage drivers in this package.
3. Version history is immutable.
4. Classification is universal (`public` … `archival`).

## Docs

`docs/jag-os/documents/`
