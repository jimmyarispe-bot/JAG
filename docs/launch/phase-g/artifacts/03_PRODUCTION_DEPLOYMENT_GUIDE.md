# 3. Production Deployment Guide

Canonical runbook: [`docs/operations/phase-f/runbooks/12_DEPLOYMENT.md`](../../../operations/phase-f/runbooks/12_DEPLOYMENT.md)

## RC-specific notes

1. Confirm Phase G RC4 is **GO** before GA cutover (currently **NO-GO**).  
2. Env: [`docs/launch/PRODUCTION_ENV.md`](../../PRODUCTION_ENV.md).  
3. Migrations: see [06_MIGRATION_GUIDE.md](./06_MIGRATION_GUIDE.md).  
4. Post-deploy: health/ready, staff login, portal login, cron with `CRON_SECRET`.  
5. Smoke: `PLAYWRIGHT_BASE_URL=<staging|prod> npm run test:smoke`

## Deployment rehearsal status

**Not completed** under RC1/RC3.
