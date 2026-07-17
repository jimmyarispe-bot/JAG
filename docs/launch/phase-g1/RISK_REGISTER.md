# Risk Register (Governance Template)

| Risk ID | Title | Likelihood | Impact | Severity | Mitigation | Residual | Status | Owner |
|---------|-------|------------|--------|----------|------------|----------|--------|-------|
| R-MT-01 | Cross-tenant leakage undetected | Med | Critical | Critical | Live RLS soak | High | Open | Security |
| R-E2E-01 | Authenticated E2E missing | High | High | Critical | Playwright journeys | High | Open | QA |
| R-SCALE-01 | Unbounded list loaders | High | High | High | Pagination + load test | High | Open | Eng |
| R-DR-01 | Untested restore | Med | Critical | High | Restore drill | High | Open | Ops |
| R-OBS-01 | Late incident detection | High | Med | High | APM + alerts | Med | Open | Ops |

Update during each RC; freeze a copy into Phase G artifacts at RC4.
