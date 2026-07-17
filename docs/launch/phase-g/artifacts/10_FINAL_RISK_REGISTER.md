# 10. Final Risk Register

| Risk ID | Likelihood | Impact | Risk | Mitigation | Residual |
|---------|------------|--------|------|------------|----------|
| R-MT-01 | Med | Critical | Cross-tenant leakage undetected | Complete live RLS soak; keep multi-org GA blocked | High until G-RC1-02 closed |
| R-SCALE-01 | High | High | SIS/admissions list OOM/timeouts | Pagination fixes + load test | High |
| R-E2E-01 | High | High | Broken role workflows in prod | Authenticated Playwright + RC2 | High |
| R-DR-01 | Med | Critical | Untested restore extends RTO/RPO | Quarterly restore drill | High |
| R-OBS-01 | High | Med | Incidents detected late | APM + alerts | Med-High |
| R-SEC-01 | Low-Med | Critical | Migrations 171/172 missing on an env | Ops checklist + verify | Med if unchecked |
| R-PILOT-01 | High | High | Skipping pilot (RC3) | Enforce Phase G sequence | High (current) |
