# RC-4 — End-to-End Role Acceptance

| Field | Value |
|-------|-------|
| **Sprint** | RC-4 Role Acceptance |
| **Status** | See `ACCEPTANCE_REPORT.md` / `00_ROLE_ACCEPTANCE_STATUS.md` |

## Commands

```bash
# Inventory + unauth gates + permission matrix + a11y static (no credentials)
npm run acceptance:rc4

# Playwright unauth role gates + login keyboard check
npm run test:acceptance

# Existing smoke
npm run test:smoke
```

### Authenticated staging (closes E-001)

```bash
export RC4_BASE_URL=https://staging.example.com
export RC4_E2E_COOKIE='...'   # or LOAD_TEST_COOKIE
npm run acceptance:rc4
```

Then run manual journeys in `04_ROLE_JOURNEY_SCRIPTS.md` and sign `08_SIGN_OFF.md`.

## Pack index

| Doc | Purpose |
|-----|---------|
| `00_ROLE_ACCEPTANCE_STATUS.md` | Overall status |
| `01_ROLE_CREDENTIAL_MATRIX.md` | Staging personas (no secrets) |
| `02_NAVIGATION_BASELINE.md` | Nav sources |
| `03_AUTOMATED_PACK.md` | What runs without auth |
| `04_ROLE_JOURNEY_SCRIPTS.md` | Manual/Playwright scripts |
| `05_CROSS_ROLE_SCENARIOS.md` | Multi-role processes |
| `06_A11Y_UX_FINDINGS.md` | Accessibility / UX |
| `07_DEFECT_TRIAGE.md` | Severity register |
| `08_SIGN_OFF.md` | Per-role sign-off |
| `ACCEPTANCE_REPORT.md` | Generated report |
