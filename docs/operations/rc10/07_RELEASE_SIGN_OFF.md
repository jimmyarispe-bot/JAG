# RC-10 Release Sign-Off

## Automated attestation

```bash
npm run rc10:suite
```

Produces a typed `GaSignOffRecord` (`src/lib/platform/production/sign-off.ts`) with:

- Package matrix (RC-4…RC-9)
- Readiness gates (16 domains)
- Final-target characteristics (6 statements)
- Decision: `go` | `conditional_go` | `no_go`

## Manual executive sign-off

Complete Phase H checklist items and record approvers in:

- `docs/launch/phase-h/00_EXECUTIVE_GA_DECISION.md`
- `docs/launch/phase-h/05_GO_LIVE_CHECKLIST.md`
- `docs/launch/phase-h/09_GA_READINESS_SCORE.md`

## Production onboarding prerequisites

Before first customer production tenant:

1. `conditional_go` items closed or formally waived (especially external pen-test report)
2. Live DR restore evidence attached to `docs/operations/rc5/04_RESTORE_REHEARSAL.md`
3. Production env validated per `docs/launch/PRODUCTION_ENV.md`
4. Hypercare rota named (Phase G.2)

## Governance

RC-10 adds **no product features**. Sign-off is readiness-only.
