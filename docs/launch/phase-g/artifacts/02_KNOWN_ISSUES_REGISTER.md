# 2. Known Issues Register

| ID | Sev | Issue | Workaround / mitigation | Target |
|----|-----|-------|-------------------------|--------|
| G-RC1-01 | Critical | No authenticated E2E | Manual QA only | Before RC1 re-sign |
| G-RC1-02 | Critical | Live RLS not soak-tested | Limit to trusted single-tenant pilots with acceptance | Before RC1 re-sign |
| G-RC1-05 | Critical | Scheduling/attendance/API under-tested | Avoid claiming ops GA | Before RC2 |
| G-RC1-07 | High | Scale unproven; unbounded lists risk | Cap usage; avoid large SIS dumps | C.1 / E.1 |
| G-RC1-08 | High | DR restore unproven | Rely on Supabase PITR; schedule restore drill | F.1 |
| G-RC1-09 | High | No APM/alerting pack | Vercel logs only | F.1 |
| — | Medium | Lint unused-var warnings | Non-blocking | Maintenance |
| — | Low | Exec Phase-2 “coming soon” routes | Hidden/disabled in nav | Post-GA |

Full blocker detail: `../rc1/02_RELEASE_BLOCKER_LIST.md` · `../DEFECT_REGISTER.md`
