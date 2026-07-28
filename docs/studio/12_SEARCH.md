# Studio Semantic Search

JS-002 — Concept-aware repository search over the persistent catalog.

## Behavior

1. Tokenize the query.
2. Expand known concepts (e.g. “student attendance” → attendance, student, sis, …).
3. Score each catalog entry on name, path, kind, keywords, and symbols.
4. Return top hits with `matchedOn` evidence.

## Built-in concepts

| Query concept | Expansion tokens |
|---------------|------------------|
| student attendance | attendance, student, sis, present, absent |
| insight providers | insight, provider, executive, intelligence, dashboard |
| role permissions | permission, role, authorization, rbac, scope |
| tuition | tuition, invoice, billing, finance, scholarship, payment |
| payroll | payroll, timesheet, workforce, compensation |
| twin | twin, digital, mapping, entity, person, document |
| connector | connector, quickbooks, sync, runtime |

## Scoring (per token match)

| Field | Points |
|-------|--------|
| name | +12 |
| keyword | +10 |
| symbol | +9 |
| kind | +8 |
| path | +6 |

Boosts: `api` +3, `doc` +2, `per` +4.

## API

`GET /api/studio/search?q=…`

| Query | Effect |
|-------|--------|
| `q` | Required search string |
| `kinds` | Comma-separated `CatalogEntryKind` filter |
| `limit` | Max hits (default 40, max 100) |
| `force=1` | Rebuild catalog before search |

## Impact analysis

Related: `GET|POST /api/studio/impact` with `target` and optional `changeKind`:

- `rename_interface`
- `remove_api`
- `promote_per`
- `modify_service`
- `generic`

Reports affected packages, products, tests, documentation, APIs, and severity.
