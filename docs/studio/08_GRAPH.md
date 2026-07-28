# Studio Architecture Graph

JS-002 — Live architecture graph built from the persistent repository catalog.

## Purpose

Studio is the authoritative source of truth for platform structure. The graph answers:

- What depends on this service?
- Which APIs are unused?
- Which packages consume this entity?
- What breaks if this interface changes?

## Data model

### Nodes (`GraphNode`)

| Kind | Source |
|------|--------|
| `package` | `packages/*` dependency graph |
| `service` | Exported `create*Service` / service factories |
| `api` | `src/app/api/**` routes |
| `entity` | Domain entity symbols |
| `event` | Platform / pack event types |
| `connector` | Connector modules + `connectors/` |
| `insight_provider` | Registered Insight Provider ids |
| `twin_mapping` | Digital Twin entity mappings |
| `per` | PER catalog entries |
| `test` | Test files |
| `doc` | Documentation files |

### Edges (`GraphEdge`)

| Relation | Meaning |
|----------|---------|
| `depends_on` | Package → package dependency |
| `consumes` | Module imports another package / SDK |
| `exposes` | Package owns a service/API/entity |
| `tested_by` | Node → test file |
| `documented_by` | Node → doc file |
| `emits` | Package emits event |
| `maps_to` | Twin mapping ↔ package |
| `references` | PER references packs |

## Indexing strategy

1. `indexRepositoryCatalog()` builds/reads the persistent catalog snapshot.
2. `buildArchitectureGraph()` projects catalog entries into nodes/edges.
3. Catalog version is hashed into `catalogVersion` for cache coherence.
4. Reuse cached catalog unless `force=1`.

## API

`GET /api/studio/graph`

| Query | Effect |
|-------|--------|
| `dashboard=1` | Architecture dashboard summaries |
| `summary=1` | Node/edge counts by kind |
| `nodeId` + `dependents=1` | Incoming edges |
| `nodeId` + `dependencies=1` | Outgoing edges |
| `kind`, `q`, `page`, `pageSize` | Filter + paginate nodes |

## Constraints

Analyzes Platform Foundation, AcademyOS, and SDK — does not modify them.
Gaps become PERs under `docs/studio/06_PLATFORM_ENHANCEMENT_REQUESTS.md`.
