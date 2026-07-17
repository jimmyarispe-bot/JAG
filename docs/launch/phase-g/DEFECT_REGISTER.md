# Phase G — Release Defect Register

Master list for RC program. Includes inherited blockers.

| ID | Sev | RC impact | Summary | Status | Trace |
|----|-----|-----------|---------|--------|-------|
| G-RC1-01 | Critical | Blocks RC1+ | Authenticated E2E missing | Open | E-001 |
| G-RC1-02 | Critical | Blocks RC1+ | Live multi-tenant RLS soak | Open | E-002 |
| G-RC1-03 | Critical | Blocks RC1+ | Staging deploy not evidenced | Open | New |
| G-RC1-04 | Critical | Blocks RC1+ | Migrations 171/172 apply evidence | Open | B.1 / ops |
| G-RC1-05 | Critical | Blocks RC1+ | Ops workflow / API test gaps | Open | E-003/E-004 |
| G-RC1-06 | High | Blocks RC4 | A11y regression CI | Open | E-007 |
| G-RC1-07 | High | Blocks RC4 | Perf load/stress | Open | Phase C |
| G-RC1-08 | High | Blocks RC4 | DR restore rehearsal | Open | F1-03 |
| G-RC1-09 | High | Blocks RC4 | APM/alerting | Open | F1-04 |
| G-RC2-01 | Critical | Blocks RC2 | Business validation not run | Open | RC2 |
| G-RC3-01 | Critical | Blocks RC3 | Pilot not deployed | Open | RC3 |

### Change control (Phase G)

No product feature PRs accepted during RC without release-manager exception.  
Every fix must: tests · quality gates · issue ID · docs note.
