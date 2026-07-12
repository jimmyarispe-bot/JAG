# Organizational Improvement Engine — Verification Checklist

## Static

- [ ] Package exists at `src/lib/platform/intelligence/organizational-improvement/`
- [ ] `types.ts` / `contracts.ts` remain leaf (no implementation imports)
- [ ] `organizational-improvement` in `OIOS_INTELLIGENCE_DOMAINS` and active in `defaultRegisteredDomains()`
- [ ] `organizational-improvement` in `INTELLIGENCE_MODULE_IDS`
- [ ] Module adapter registered after `opportunity` in `createDefaultIntelligenceModules()`
- [ ] `createIntelligenceService()` exposes `.organizationalImprovement`
- [ ] Public exports present on `@/lib/platform/intelligence`
- [ ] README + CHANGELOG + sprint/architecture docs present

## Behavioral

- [ ] `service.build()` returns scores, sources, analysis, planning, loop, dashboards, briefs
- [ ] All 10 source domains produce improvements
- [ ] Analysis covers priority, impact, mission, financial, risk, TTV, resources, capacity, dependencies, confidence
- [ ] Planning suite includes quick wins, strategic, transformation, weekly/monthly/quarterly/annual
- [ ] Loop stages match `IMPROVEMENT_LOOP_STAGES` (12 stages)
- [ ] Daily brief includes top 5 + highest financial/mission/people/revenue/funding/operational/risk/confidence
- [ ] Every top improvement includes all ten `ImprovementLensImpact` keys
- [ ] Query + repository persistence work
- [ ] Platform pipeline order ends with `organizational-improvement`
- [ ] All module results `ok: true`

## Commands

```bash
npx tsc --noEmit
npx vitest run tests/unit/intelligence/
```

## Expected pipeline order

```
organization-dna → oios-core → organization-health → financial → founder
→ executive → executive-graph → executive-decision → predictive
→ board-governance → human-capital → revenue → funding → opportunity
→ organizational-improvement
```
