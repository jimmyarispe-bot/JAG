# 5. Regression Test Report

## Automated regression pack (executed)

| Gate | Command | Result |
|------|---------|--------|
| TypeScript | `npm run typecheck` | **PASS** (after Phase E test typing fixes) |
| Lint errors | `npm run lint` | **PASS** (0 errors; warnings remain) |
| Unit + integration | `npm run test` | **PASS** — 890/890 (post-fix) |
| Integration only | `npm run test:integration` | **PASS** |
| Build validators | part of `npm run build` | Not re-run in full CI simulation this session |
| Smoke | `npm run test:smoke` | Environment-dependent; not used as sole regression proof |

## Regression categories

| Category | Status |
|----------|--------|
| Broken workflows (ops) | **Unknown** — insufficient E2E |
| UI regressions | **Unknown** — no visual/a11y suite |
| API regressions | **Unknown** — no API tests |
| Permission regressions | **Partial pass** — engine unit + Phase E matrix |
| Performance regressions | **Partial** — unit probes only; Phase C load not re-run |
| Accessibility regressions | **Partial** — D.1 code fixes; no axe CI |

## Phase E code fixes applied (non-feature)

- Lint: empty interface → type aliases; `module` variable renames; Sidebar ref sync via `useEffect`
- Typecheck: mock Supabase typing; connector fixtures; identity `primaryRole`; decision impact flags
- Unit: production env secrets expectation includes `VAULT_ENCRYPTION_KEY`
- Added certification unit tests under `tests/unit/certification/`
