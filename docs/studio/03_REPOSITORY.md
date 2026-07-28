# Repository Intelligence

The scanner understands:

`packages/` · `apps/` · `docs/` · `tests/` · `connectors/` · `sdk/` · `migrations/` · `apis/` · plus `src/app/api` and core `src/lib/*` roots.

Indexes:

- services
- APIs
- entities
- events
- permissions
- tests
- docs
- dependencies
- connectors
- migrations
- SDK surfaces
- packages

## JS-002 enrichment

`buildRepositoryIntelligence()` / `createRepositoryIntelligenceService()` adds:

- Service factory symbols (`create*Service`)
- API route HTTP methods (`GET`/`POST`/…)
- Permission IDs and event type strings
- Twin `academyEntity` mappings
- `package.json` dependency graphs
- Recommendations for coverage gaps

API: `GET /api/studio/repository?intelligence=1`
