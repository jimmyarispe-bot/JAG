# Behavioral Intelligence Verification (Sprint 052)

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/behavioral.test.ts tests/unit/intelligence/reputation.test.ts tests/unit/intelligence/stakeholder.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
```

Assert pipeline terminal order: `... stakeholder, reputation, behavioral`.
