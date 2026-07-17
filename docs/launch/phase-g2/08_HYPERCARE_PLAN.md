# 8. Hypercare Plan

| Field | Value |
|-------|-------|
| **Status** | **PREPARED — NOT ACTIVATED** |
| **Duration** | First **72 hours** after production GA deploy |
| **Activation condition** | Production Acceptance = ACCEPTED + executive GO |

## Monitoring focus (T+0 → T+72h)

Critical defects · Support requests · Performance · Availability · Security events · Operational issues · User feedback · Deployment metrics

## Cadence

| Window | Coverage | Actions |
|--------|----------|---------|
| T+0–4h | Eng + Ops bridge | Watch error rates, auth, cron |
| T+4–24h | On-call + business hours | Triage SEV-1/2 |
| T+24–72h | Business hours + paging | Daily standup; defect burn-down |

## Exit criteria

- No open Critical production defects  
- Error rate within SLO for 24h  
- Support volume sustainable  
- Release manager approval to exit hypercare  

## Related

`docs/launch/phase-h/06_HYPERCARE_AND_ROLLBACK.md`
