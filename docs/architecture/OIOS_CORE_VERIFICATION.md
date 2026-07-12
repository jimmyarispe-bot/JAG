# OIOS Core — Verification

**Sprint:** 031  
**Date:** July 12, 2026  
**Package:** `src/lib/platform/oios/`

## Package checklist

- [x] OrganizationOperatingSystem
- [x] IntelligenceDomainRegistry
- [x] OrganizationalDigitalTwin
- [x] OrganizationalLifecycle / StateEngine / Context
- [x] OrganizationalMemory / KnowledgeGraph
- [x] Capabilities / Improvement / ContinuousImprovementLoop
- [x] HealthIndex / MaturityModel / Scorecard / Benchmarking
- [x] Objectives / Strategy / ExecutionModel / OperatingModel
- [x] Configuration / Policies / Standards / GovernanceModel
- [x] createOiosOperatingSystem DI + OiosStack
- [x] Platform module `oios-core`
- [x] createIntelligenceService().oios wiring
- [x] Architecture docs

## Wiring checklist

- [x] `INTELLIGENCE_MODULE_IDS` includes `oios-core`
- [x] Default pipeline: `organization-dna` → `oios-core` → …
- [x] Context key `oios`
- [x] Exports from `@/lib/platform/oios` and selective re-exports from intelligence index

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/oios-core.test.ts
npx vitest run tests/unit/intelligence
```

## Expected results

- TypeScript clean
- OIOS unit tests pass
- Infrastructure pipeline order includes `oios-core` (10 modules)
- organization-dna pipeline assertion updated

## Manual smoke

```ts
const service = createIntelligenceService();
const result = service.oios.service.build({
  requestId: "smoke-1",
  scope: { organizationId: "org-1", schoolId: "school-1" },
  dnaSeed: { name: "Smoke Org", stageHint: "startup" },
});
console.log(result.health.band, result.maturity.level, result.domains.length);
```

## Verification run log

| Check | Result | Date |
|-------|--------|------|
| `npx tsc --noEmit` | Pass | 2026-07-12 |
| `npx vitest run` (full suite) | 56 files / 581 tests pass | 2026-07-12 |
| Circular imports (`madge`) on OIOS | None | 2026-07-12 |
| Pipeline order includes `oios-core` | Pass (10 modules) | 2026-07-12 |
