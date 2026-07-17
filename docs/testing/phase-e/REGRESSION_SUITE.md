# Regression Suite

## Always-on (CI)

1. `npm run lint`  
2. `npm run typecheck`  
3. `npm run build` (validators + Next build)  
4. `npm run test:integration`  
5. Playwright smoke (`npm run test:smoke`)

## Recommended local full pack

```bash
npm run lint && npm run typecheck && npm run test && npm run test:integration
```

## Phase E certification pack

- `tests/unit/certification/phase-e-permission-matrix.test.ts`  
- `tests/unit/certification/phase-e-error-handling.test.ts`  
- `tests/unit/certification/phase-e-ai-tenant-boundary.test.ts`  
- Existing IAM / B.1 / D.1 / A.1 remediation suites  

## Not yet in CI (E.1 backlog)

- Authenticated role E2E  
- Live RLS  
- axe accessibility  
- Multi-browser matrix  
- Load/stress replay
