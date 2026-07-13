# Wisdom Intelligence Verification

## Commands

```
npx tsc --noEmit
npx vitest run tests/unit/intelligence/wisdom.test.ts
```

## Checks

1. Result version is 0.1.0 with all 17 area and engine scores populated.
2. Analysis kinds and scenarios cover WISDOM_ANALYSIS_KINDS / WISDOM_SCENARIOS.
3. Recommendations carry the eight-field WisdomLens; IDs use `wis-` prefix.
4. Closed learning destinations match the seven redistribution domains.
5. Platform module order ends `collective`, `wisdom`.
6. Scenario records use organizationalImpact, judgmentImpact, timingImpact fields.
7. Outlooks use: wise, stable, shortsighted, volatile, uncertain.
