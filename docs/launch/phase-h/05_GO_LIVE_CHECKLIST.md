# Go-Live Checklist (held until GA GO)

Do **not** execute production cutover while Phase H is NO-GO. Checklist retained for the future GO window.

## T-7 days

- [ ] Phase H score ≥ 85 and Critical defects closed  
- [ ] Phase G pilot exit report signed  
- [ ] Migrations 171+172 verified on staging + production plan  
- [ ] Env vars validated via production schema (`src/lib/platform/env`)  
- [ ] Support on-call roster published  
- [ ] Customer / internal comms drafted  

## T-1 day

- [ ] Staging smoke (authenticated roles) green  
- [ ] Backup / PITR mark recorded  
- [ ] Rollback owner named  
- [ ] Feature flags / module toggles confirmed  

## T-0 deploy

- [ ] Deploy app (see `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md`)  
- [ ] Apply migrations if pending  
- [ ] Verify `/api/health` and `/api/ready`  
- [ ] Staff login + one module  
- [ ] Portal login  
- [ ] Cron invocation with `CRON_SECRET`  
- [ ] 30-minute error-rate watch  

## T+1 / T+7 hypercare

- [ ] Daily defect triage  
- [ ] Tenant isolation spot checks (Org A / Org B)  
- [ ] Performance spot check on SIS/admissions lists  
- [ ] Exit hypercare only with release manager approval  

**Status:** Checklist frozen — cutover blocked by NO-GO decision.
