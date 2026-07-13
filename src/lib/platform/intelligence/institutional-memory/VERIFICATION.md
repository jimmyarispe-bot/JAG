# Institutional Memory Intelligence Verification

## Commands

```
npx tsc --noEmit
npx vitest run tests/unit/intelligence/institutional-memory.test.ts tests/unit/intelligence/ecosystem.test.ts tests/unit/intelligence/resilience.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
```

## Checks

1. Result version is 0.1.0 with all area and engine scores populated.
2. Analysis kinds and scenarios cover INSTITUTIONAL_MEMORY_ANALYSIS_KINDS / INSTITUTIONAL_MEMORY_SCENARIOS.
3. Recommendations carry the eight-field InstitutionalMemoryLens; IDs use `imm-` prefix.
4. Closed learning destinations match the seven redistribution domains.
5. Platform module order ends `resilience`, `ecosystem`, `institutional-memory`.
6. Sprint 040 `knowledge/` source is unmodified.
