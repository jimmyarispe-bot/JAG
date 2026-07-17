# Quality Gates Documentation

## CI gates (`.github/workflows/ci.yml`)

Lint → Typecheck → Build → Integration tests → Playwright smoke  

Note: CI lint does **not** use `--max-warnings 0`. Phase E charter requires **zero errors**; warnings tracked as Medium debt.

## Release Phase E gates

Documented in [10_PRODUCTION_READINESS_SCORE.md](./10_PRODUCTION_READINESS_SCORE.md).

## Local gate script (recommended)

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
```

Do not proceed to Phase F while any Critical gate is ✗.
