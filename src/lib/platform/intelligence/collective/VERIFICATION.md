# Collective Intelligence Verification

## Commands

```
npx tsc --noEmit
npx vitest run tests/unit/intelligence/collective.test.ts
```

## Checks

1. Result version is 0.1.0 with all 17 area and engine scores populated.
2. Analysis kinds and scenarios cover COLLECTIVE_ANALYSIS_KINDS / COLLECTIVE_SCENARIOS.
3. Recommendations carry the eight-field CollectiveLens; IDs use `col-` prefix.
4. Closed learning destinations match the seven redistribution domains.
5. Platform module order ends `institutional-memory`, `collective`.
6. Scenario records use organizationalImpact, consensusImpact, expertiseImpact fields.
7. Outlooks use: aligned, stable, contested, volatile, uncertain.
