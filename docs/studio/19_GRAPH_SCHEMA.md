# Knowledge Graph Schema

## Node kinds (`KnowledgeNodeKind`)

`product`, `package`, `module`, `service`, `api`, `entity`, `event`, `workflow`, `notification`, `insight_provider`, `document`, `test`, `test_suite`, `per`, `release`, `role`, `connector`, `twin_mapping`

Each node: `id`, `kind`, `label`, `path`, `ownerPackage`, `productId`, `metadata`, `keywords`, `updatedAt`.

## Edge kinds (`KnowledgeEdgeKind`)

| Kind | Meaning |
|------|---------|
| `CONTAINS` | Package → module/service/api |
| `USES` | Module → service |
| `EXPOSES` | Module/service → API |
| `RETURNS` | API → entity |
| `EMITS` | Module → event |
| `TRIGGERS` | Event → workflow |
| `GENERATES` | Workflow → notification |
| `REFERENCES` | Package/product → PER |
| `CERTIFIES` | Release → product |
| `VALIDATES` | Test → module/package |
| `DESCRIBES` / `DOCUMENTS` | Document → package |
| `DEPENDS_ON` / `CONSUMES` | Package → package |
| `OWNED_BY` / `PART_OF` / `MAPS_TO` / `IMPLEMENTS` | Ownership & structure |

New kinds can be added to the const arrays without breaking existing edges.

## Ingestion

`ingestKnowledgeSources()` reads:

1. Repository catalog snapshot
2. Product registry
3. PER registry
4. Release metadata
5. Testing workspace suites
6. Deterministic AcademyOS module map
7. Platform package surfaces

## Storage

Process-global snapshot `globalThis.__jagStudioKnowledgeGraph`, cleared by `resetStudioStoreForTests()`. Version = short hash of catalog version + node/edge counts.
