# Funding Intelligence Verification Checklist

## Static checks

- [x] `npx tsc --noEmit` passes
- [x] Package imports use `@/lib/platform/intelligence/funding/...`
- [x] `types.ts` and `contracts.ts` are implementation-free leaf modules
- [x] No existing intelligence package regenerated
- [x] Domain `funding` active in OIOS registry
- [x] Module id `funding` in `INTELLIGENCE_MODULE_IDS`
- [x] Platform adapter writes context key `funding`
- [x] `createIntelligenceService().funding` wired
- [x] README + CHANGELOG + architecture docs present

## Behavioral checks

- [x] Default build produces non-empty records across government, grants, contracts, philanthropy, investment, alternative, and strategy suites
- [x] Scores, funding health, dashboards, calendar, brief, and projection populated
- [x] Top opportunities carry all five `FundingLensImpact` fields
- [x] Query focuses return relevant references
- [x] Repository stores results and history
- [x] Pipeline order ends `… → human-capital → revenue → funding`
- [x] Full `tests/unit/intelligence/` suite passes (306 tests)

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/
```
