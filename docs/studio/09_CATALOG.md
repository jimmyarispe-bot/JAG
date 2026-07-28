# Studio Repository Catalog

JS-002 — Persistent searchable index of the monorepo.

## Indexed roots

- `packages/`
- `apps/` (when present)
- `docs/`
- `tests/`
- `supabase/`
- `connectors/`

## Entry fields

Each `CatalogEntry` tracks:

| Field | Description |
|-------|-------------|
| `ownerPackage` | Owning pack / package id |
| `exports` / `imports` | Parsed symbols and import paths |
| `routes` | HTTP methods for APIs |
| `schemas` / `migrations` | Supabase / schema artifacts |
| `tests` | Linked test paths |
| `documentationLinks` | Linked docs |
| `symbols` / `keywords` | Search tokens |

## Persistence

Snapshots live in process memory (`globalThis.__jagStudioCatalogSnapshot`):

- Survives across requests within the same Node process.
- Cleared by `resetStudioStoreForTests()` / `clearCatalogSnapshot()`.
- Rebuilt when `force=1` or root changes.
- Version = short SHA1 of `root|scannedAt|entryCount`.

This avoids full-repo scans on every Studio API call.

## API

`GET /api/studio/catalog`

| Query | Effect |
|-------|--------|
| `meta=1` | Version, counts, indexedAt |
| `kind`, `q`, `ownerPackage` | Filter entries |
| `page`, `pageSize` | Pagination |
| `force=1` | Rebuild index |

## Incremental updates

Call `indexRepositoryCatalog({ force: true })` after repository changes (CI hook or Studio refresh). Without `force`, the prior snapshot is returned when the root matches.
