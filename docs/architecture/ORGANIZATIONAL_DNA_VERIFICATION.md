# Organizational DNA & Company Builder — Verification Checklist

**Sprint:** 030  
**Date:** July 12, 2026  
**Branch:** `founder-os-beta`

## Package

- [x] `src/lib/platform/intelligence/organization-dna/` complete
- [x] All requested components implemented and exported
- [x] `createOrganizationDnaIntelligence()` DI factory works
- [x] README + CHANGELOG present

## Wiring

- [x] Platform module `organization-dna` registered first
- [x] `createIntelligenceService().organizationDna` attached
- [x] `createIntelligencePlatform` accepts `organizationDna` options
- [x] Master `intelligence/index.ts` re-exports public API

## Verification commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/organization-dna.test.ts
npx vitest run tests/unit/intelligence/
```

## Expected results

- [x] TypeScript compiles with no errors
- [x] Organization DNA unit tests pass
- [x] Infrastructure / predictive / board-governance tests updated for new module order
- [x] No circular imports between organization-dna and board-governance (types-only + DI factory edges only)
- [x] Production-ready defaults when seed / upstream signals are sparse

## Manual smoke

```ts
const { service } = createOrganizationDnaIntelligence({
  wireGraphAnalyzer: false,
  wireDecision: false,
  wirePredictive: false,
  wireBoardGovernance: false,
});
const result = service.buildFromSeed({ name: "Test Org", stageHint: "idea" });
// expect artifacts.length === 12, dna.stage === "idea"
```

## Verification run (2026-07-12)

- `npx tsc --noEmit` — pass
- `npx vitest run tests/unit/intelligence/` — 22 files, 290 tests passed
