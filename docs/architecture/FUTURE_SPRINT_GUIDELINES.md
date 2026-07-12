# Future Sprint Guidelines (OIOS)

## Purpose

Rules every future intelligence sprint must follow so JAG OIOS remains coherent.

## Non-negotiables

1. **Do not regenerate** existing packages (`organization-dna`, health, founder, graph, decision, predictive, board-governance, infrastructure, oios).
2. **Extend** via new domain packages + DI + platform module registration.
3. **Register** domains in the OIOS catalog before claiming them active.
4. **Keep leaf modules leaf** (`types` / `contracts` import-free of implementations).
5. **Prove** with `npx tsc --noEmit`, unit tests, and pipeline order assertions.

## Sprint checklist

1. Confirm domain key exists in `OIOS_INTELLIGENCE_DOMAINS`.
2. Create `src/lib/platform/intelligence/{domain}/` with types/contracts/models/index.
3. Implement `create{Domain}Intelligence()` returning a typed stack.
4. Add `infrastructure/modules/{domain}.ts` adapter writing a context key.
5. Add module id to `INTELLIGENCE_MODULE_IDS` and default provider order.
6. Wire optionally in `createIntelligenceService()` / platform options.
7. Activate domain status in OIOS registry (registered → active).
8. Add architecture + verification docs + README/CHANGELOG.
9. Add unit tests including `createIntelligenceService` wiring and pipeline order.
10. Run verification commands.

## Future domains (reserved)

Revenue, Funding, Opportunity, Operations, Customer, Knowledge, Document, Legal, Compliance, Risk, Market, Innovation, Impact.

## Suggested dependency defaults

Most future domains should:

- Depend on `organization-dna` and/or `oios-core` in the platform DAG
- Read `context.get("oios")` for twin/strategy/governance
- Avoid hard dependencies on every upstream product module unless required

## Commit message style

```
feat(intelligence): add Sprint NNN {Domain} Intelligence

{Why this domain exists in one or two sentences.}
```
