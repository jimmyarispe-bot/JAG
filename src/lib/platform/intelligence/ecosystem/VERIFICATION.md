# Ecosystem Intelligence Verification

## Commands

```
npx tsc --noEmit
npx vitest run tests/unit/intelligence/ecosystem.test.ts tests/unit/intelligence/resilience.test.ts tests/unit/intelligence/systems.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
```

## Checks

1. Result version is 0.1.0 with all area and engine scores populated.
2. Analysis kinds and scenarios cover ECOSYSTEM_ANALYSIS_KINDS / ECOSYSTEM_SCENARIOS.
3. Recommendations carry the eight-field EcosystemLens; IDs use `esm-` prefix.
4. Closed learning destinations match the seven soft-integration domains.
5. Platform module order ends `systems`, `resilience`, `ecosystem`.
