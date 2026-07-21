# RC-5 — RLS Soak Evidence

Generated: 2026-07-19T01:29:38.274Z
Overall: **deferred_with_harness**
Live mode: false

## Findings

- **[pass] rls.migration.171** — 171_a1_architecture_security_rls.sql present
- **[pass] rls.migration.003** — 003_enable_rls.sql present
- **[pass] rls.checklist.encoded** — Negative cases documented: Org A teacher cannot list Org B students; Org A parent cannot read Org B portal finance; Service role not used from browser; Anon key cannot select tenant tables without JWT
- **[deferred] rls.live.soak** — Set RC5_RLS_A_COOKIE + RC5_RLS_B_COOKIE (two staging orgs) to execute live soak. Formally deferred for Go/No-Go with rationale.

## Negative checklist

- [ ] Org A teacher cannot list Org B students
- [ ] Org A parent cannot read Org B portal finance
- [ ] Service role not used from browser
- [ ] Anon key cannot select tenant tables without JWT

## Close criteria (G-RC1-02)

Live soak closes when two seeded orgs produce empty/deny on cross-tenant reads and evidence is attached under `docs/operations/rc5/artifacts/`.
