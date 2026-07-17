# 7. Rollback Validation Report

| Field | Value |
|-------|-------|
| **Status** | **PROCEDURE DOCUMENTED — NOT REHEARSED** |

## Procedures (canonical)

`docs/operations/phase-f/runbooks/12_DEPLOYMENT.md` · Phase G.1 dress-rehearsal package

| Element | Status |
|---------|--------|
| App rollback (prior Vercel deployment) | Documented |
| DB rollback / restore | Documented; restore not evidenced |
| Infrastructure rollback | Documented at platform level |
| Decision criteria | SEV-1 cross-tenant, auth outage, corruption |
| Timing estimate | TBD at RC3.5 |
| Communication plan | See launch communication package |
| Responsibilities | Release manager + Ops + Eng on-call |

## Rehearsal evidence

| Drill | Date | Result |
|-------|------|--------|
| App promote previous | — | Not run |
| PITR restore | — | Not run |
