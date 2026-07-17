# Release Operations Manual — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Standardize release, go/no-go, rollback, and post-deploy verification |
| **Scope** | AcademyOS 1.0 releases to production |
| **Audience** | Release manager, eng leads |
| **Prerequisites** | Phase F ops docs; CI access |
| **Version** | 1.0.0 |

---

## Branch strategy (current practice)

| Branch | Use |
|--------|-----|
| `main` | Integration; CI on push/PR |
| Feature branches | PR into `main` |
| Deploy | Vercel production tracks `main` (confirm project setting) |

No git-flow enforcement in repo — follow org policy if stricter.

---

## Release checklist

- [ ] Scope agreed; no unintended features  
- [ ] Security Phase B Critical/High status reviewed  
- [ ] Migrations reviewed; backward compatible or sequenced  
- [ ] Docs updated (API/DB/ops if behavior changed)  
- [ ] CI green  
- [ ] Staging validation (if available)  
- [ ] Rollback owner named  
- [ ] Communication drafted  

## Deployment checklist

- [ ] Env vars present (`PRODUCTION_ENV.md`)  
- [ ] Backup / PITR mark if migrating  
- [ ] Deploy app (`runbooks/12_DEPLOYMENT.md`)  
- [ ] Apply migrations if any  
- [ ] Post-deploy validation  
- [ ] Cron verified  

## Rollback checklist

- [ ] Decision: app vs DB vs both  
- [ ] Promote previous Vercel deployment  
- [ ] DB restore only if necessary  
- [ ] Verify health/ready + logins  
- [ ] Incident notes updated  

## Go / No-Go checklist

| Gate | Go if |
|------|-------|
| CI | Green |
| Security | No open Critical from Phase B **or** accepted risk signed |
| Migrations | Tested on staging clone |
| Support | On-call coverage |
| Docs | Runbooks match release changes |
| UX blockers | No SEV-1 UX break on login/portal |

## Post-deployment / production verification

1. Health + ready  
2. Staff login → one module  
3. Portal login  
4. One authorized export  
5. Manual queue drain optional  
6. 30-minute watch on error rates  

## Smoke tests

```bash
npm run test:smoke
# with PLAYWRIGHT_BASE_URL pointing at target
```

CI already runs smoke with placeholder env (limited). Prefer staging URL for real smokes.

## Troubleshooting

| Issue | Action |
|-------|--------|
| No-Go disagreement | Escalate release manager + security |
| Hotfix | Patch forward with same checklists |

## Related documents

- `runbooks/12_DEPLOYMENT.md`
- `docs/launch/LAUNCH_READINESS_REPORT.md`
- `docs/launch/phase-h/` — Phase H GA decision & scorecard (current: **NO-GO**)

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
