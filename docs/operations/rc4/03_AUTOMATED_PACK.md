# RC-4 — Automated Pack

## Without credentials

| Command | Coverage |
|---------|----------|
| `npm run acceptance:rc4` | Route inventory, unauth HTTP gates (if server up), cross-role path chain, permission matrix unit tests, a11y static |
| `npm run test:acceptance` | Playwright role-home → `/login` redirects + login keyboard focus |
| `npm run test:smoke` | Login form labels, legacy admin redirect, home title |
| `npm run test:unit -- tests/unit/certification/phase-e-permission-matrix.test.ts` | Permission catalog |

## With staging cookie

| Command | Coverage |
|---------|----------|
| `RC4_E2E_COOKIE=… npm run acceptance:rc4` | Authenticated HTTP smoke of role homes (best-effort) |

## Not automated yet (E-001)

- Full instructional day (teacher)  
- Parent payment completion  
- Lead→billing data mutations  
- Cross-role consistency asserts on DB rows  
