# 4. Rollback Guide

Canonical: [`docs/operations/phase-f/runbooks/12_DEPLOYMENT.md`](../../../operations/phase-f/runbooks/12_DEPLOYMENT.md) (Rollback section) and [`14_RELEASE_OPERATIONS_MANUAL.md`](../../../operations/phase-f/14_RELEASE_OPERATIONS_MANUAL.md).

## Summary

1. Promote previous Vercel deployment.  
2. DB restore only if migration/data corruption requires PITR.  
3. Disable/pause cron if queue storm.  
4. Open incident per `runbooks/11_INCIDENT_RESPONSE.md`.

## Rehearsal status

**Not rehearsed** in Phase G RC1.
