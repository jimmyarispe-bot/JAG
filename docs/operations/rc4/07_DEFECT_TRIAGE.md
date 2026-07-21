# RC-4 — Defect Triage

| ID | Severity | Status | Title | Roles | Proposed fix | Regression risk |
|----|----------|--------|-------|-------|--------------|-----------------|
| E-001 / G-RC1-01 | **Blocker** (for full accept) | Open | No authenticated multi-role E2E | All | Playwright storageState per role | High |
| E-007 / G-RC1-06 | High | Open | No axe CI | Parent, Teacher, Founder | axe-core project on critical homes | Medium |
| RC4-AUTH-PENDING | High | Accepted* | Authenticated journeys not executed this environment | All | Staging personas + `RC4_E2E_COOKIE` | High until closed |

\*Accepted for **accepted_with_gaps** status with explicit rationale: no staging credentials in CI/dev; unauth gates + inventory green; no new exposure defects.

## Classification rules used

- **Blocker** — prevents production role work or exposes unauthorized data  
- **High** — major workflow impaired or missing automation for critical path  
- **Medium** — workaround exists  
- **Low** — cosmetic / minor UX  

## New blockers found this sprint

None (no ungated protected routes discovered).
