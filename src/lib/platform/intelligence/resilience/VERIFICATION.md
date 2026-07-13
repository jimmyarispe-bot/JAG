# Resilience Intelligence Verification

## Commands

```
npx tsc --noEmit
npx vitest run tests/unit/intelligence/resilience.test.ts tests/unit/intelligence/systems.test.ts tests/unit/intelligence/ethical.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
```

## Checks

1. Result version is 0.1.0 with all area and engine scores populated.
2. Analysis kinds and scenarios cover RESILIENCE_ANALYSIS_KINDS / RESILIENCE_SCENARIOS.
3. Recommendations carry the eight-field ResilienceLens; IDs use `rsl-` prefix.
4. Closed learning destinations match the seven soft-integration domains.
5. Platform module order ends `ethical`, `systems`, `resilience`.
