# Platform Testing Strategy

AcademyOS platform engineering uses a layered test strategy focused on registry integrity, service behavior, and route smoke coverage.

## Test layers

| Layer | Runner | Location | Purpose |
|-------|--------|----------|---------|
| **Build validation** | `tsx` via `npm run validate:platform` | `scripts/validate-platform-registry.mts` | Fail builds on registry integrity issues |
| **Integration (unit-style)** | Vitest | `tests/integration/` | Profile route resolution, platform service behavior |
| **Smoke (E2E)** | Playwright | `tests/smoke/` | Unauthenticated route guards and page load |

CI runs: lint → typecheck → build (includes registry validation) → integration tests → Playwright smoke tests.

## Profile route tests

Integration tests in `tests/integration/profile-routes.test.ts` cover:

- Overview default section
- Deep links (`?section=`)
- Legacy `?tab=` mapping (student inline remap, employee redirect URL builder)
- Permission denial (`hiddenReason: "permission"`)
- Module disabled gating (`hiddenReason: "module_disabled"`)
- Unknown section fallback to kind default
- Notes and activity sections (employee `notes`/`activity`, student `timeline`)

Smoke tests in `tests/smoke/profile-routes.spec.ts` verify unauthenticated users are redirected to login for profile and diagnostics routes.

## Platform service tests

Integration tests in `tests/integration/platform-services.test.ts` use mocked Supabase clients (`tests/helpers/mock-supabase.ts`) to verify:

| Engine | Coverage |
|--------|----------|
| Activity | Input validation, insert + timeline dual-write |
| Relationships | Create, upsert duplicate prevention, ended relationship idempotency |
| Tags | Permission denial, upsert duplicate prevention |
| Notes | Mention deduplication, CRUD audit side-effects |

Pure helpers (`validateRecordActivityInput`, `normalizeMentionedUserIds`, `validateNoteAttachments`) are tested without database access.

## Registry validation

`validatePlatformRegistry()` (`src/lib/platform/diagnostics/validate-registry.ts`) runs during build and fails on:

- Duplicate section keys
- Missing section module registrations
- Orphaned section modules
- Invalid navigation groups

Vitest mirrors this check in `tests/integration/platform-registry-validation.test.ts`.

## Developer diagnostics

Read-only diagnostics at `/dashboard/platform/diagnostics` expose the same registry audit data used by build validation, plus platform service health probes and installed module snapshots.

## Running tests locally

```bash
npm run validate:platform   # registry build gate
npm run test:integration    # Vitest integration suite
npm run test:smoke          # Playwright (requires running app unless CI webServer)
npm run typecheck
npm run lint
npm run build
```

## Known gaps (technical debt)

- No authenticated Playwright fixtures for full profile UI E2E
- Platform service tests mock Supabase rather than exercising RLS policies
- Student legacy `?tab=` URLs are remapped server-side without HTTP redirect (employee uses 302)

## Phase E certification package

Release Phase E inventory, gate results, defect register, and readiness score live under:

`docs/testing/phase-e/`

Certification unit packs: `tests/unit/certification/phase-e-*.test.ts`.
