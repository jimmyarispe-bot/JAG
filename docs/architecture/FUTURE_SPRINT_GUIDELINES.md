# Future Sprint Guidelines (OIOS)

## Purpose

Rules every future intelligence sprint must follow so JAG OIOS remains coherent.

## Non-negotiables

1. **Do not regenerate** existing packages (`organization-dna`, health, founder, graph, decision, predictive, board-governance, infrastructure, oios, human-capital, revenue, funding, opportunity, organizational-improvement, business-model, operations, customer, knowledge, document, legal-compliance-risk, market, innovation, impact, economic, competitive, political, environmental, stakeholder, reputation, behavioral, cultural, ethical, systems, resilience, ecosystem, institutional-memory, collective, wisdom).
2. **Extend** via new domain packages + DI + platform module registration.
3. **Register** domains in the OIOS catalog before claiming them active.
4. **Keep leaf modules leaf** (`types` / `contracts` import-free of implementations).
5. **Prove** with `npx tsc --noEmit`, unit tests, and pipeline order assertions.
6. **Place domains** using the three-layer model in
   [INTELLIGENCE_LAYER_MODEL.md](./INTELLIGENCE_LAYER_MODEL.md) (Internal /
   External / Future).
7. **Respect the v1.0 terminal** — `wisdom` is the JAG v1.0 capstone after `collective`.
   Prefer soft reads of wisdom rather than reordering the pipeline unless a new hard
   predecessor after wisdom is explicitly justified. See
   [JAG_V1_INTELLIGENCE_GRAPH.md](./JAG_V1_INTELLIGENCE_GRAPH.md).

## Sprint checklist

1. Confirm domain key exists in `OIOS_INTELLIGENCE_DOMAINS`.
2. Decide layer placement (Internal / External / Future) and soft vs hard deps.
3. Create `src/lib/platform/intelligence/{domain}/` with types/contracts/models/index.
4. Implement `create{Domain}Intelligence()` returning a typed stack.
5. Add `infrastructure/modules/{domain}.ts` adapter writing a context key.
6. Add module id to `INTELLIGENCE_MODULE_IDS` and default provider order.
7. Wire optionally in `createIntelligenceService()` / platform options.
8. Activate domain status in OIOS registry (registered → active).
9. Add architecture + verification docs + README/CHANGELOG.
10. Add unit tests including `createIntelligenceService` wiring and pipeline order.
11. Run verification commands.

## Shipped domains

- **Sprint 045:** Impact Intelligence (Future Intelligence layer, hard dep: innovation)
- **Sprint 046:** Economic Intelligence (External Intelligence layer, hard dep: impact)
- **Sprint 047:** Competitive Intelligence (External Intelligence layer, hard dep: economic)
- **Sprint 048:** Political Intelligence (External Intelligence layer, hard dep: competitive)
- **Sprint 049:** Environmental Intelligence (External Intelligence layer, hard dep: political)
- **Sprint 050:** Stakeholder Intelligence (External / relationship layer, hard dep: environmental)
- **Sprint 051:** Reputation Intelligence (External / relationship layer, hard dep: stakeholder)
- **Sprint 052:** Behavioral Intelligence (Internal-facing behavioral after External reputation, hard dep: reputation)
- **Sprint 053:** Cultural Intelligence (Internal-facing cultural after Behavioral, hard dep: behavioral)
- **Sprint 054:** Ethical Intelligence (Internal/governance-adjacent ethical after Cultural, hard dep: cultural)
- **Sprint 055:** Systems Intelligence (Internal/cross-cutting systems dynamics after Ethical, hard dep: ethical)
- **Sprint 056:** Resilience Intelligence (Internal/adaptive capacity after Systems, hard dep: systems)
- **Sprint 057:** Ecosystem Intelligence (External/network layer after Resilience, hard dep: resilience)
- **Sprint 058:** Institutional Memory Intelligence (Knowledge evolution terminal layer after Ecosystem; Sprint 040 knowledge remains mid-pipeline frozen; hard dep: ecosystem)
- **Sprint 059:** Collective Intelligence (collaborative synthesis layer after Institutional Memory; hard dep: institutional-memory)
- **Sprint 060:** Wisdom Intelligence (JAG v1.0 capstone terminal after Collective; hard dep: collective)

## Future domains (reserved — next sprint candidates)

JAG v1.0 completes at `wisdom`. Future sprints should soft-read the terminal graph
unless a new hard DAG edge after wisdom is required. See
[JAG_V1_INTELLIGENCE_GRAPH.md](./JAG_V1_INTELLIGENCE_GRAPH.md).

`legal-compliance-risk` shipped in Sprint 042 as a single consolidated governance
domain. The `legal`, `compliance`, and `risk` keys remain registered (not active)
in case a future sprint splits the consolidated domain into separate packages.

`market` shipped in Sprint 043 as the External Intelligence domain after
`legal-compliance-risk`.

`innovation` shipped in Sprint 044 as an early Future Intelligence domain after
`market`. Prefer soft context attachments from upstream domains unless a hard DAG
edge is required for pipeline data. Layer guidance:
[INTELLIGENCE_LAYER_MODEL.md](./INTELLIGENCE_LAYER_MODEL.md).

## Suggested dependency defaults

Most future domains should:

- Depend on `organization-dna` and/or `oios-core` in the platform DAG
- Read `context.get("oios")` for twin/strategy/governance
- Avoid hard dependencies on every upstream product module unless required
- After Revenue (033), Funding (034), Opportunity (035), Organizational Improvement (036), Business Model (037), Operations (038), Customer (039), Knowledge (040), Document (041), Legal, Compliance & Risk (042), Market (043), and Innovation (044), prefer soft context attachments over hard DAG edges unless required for pipeline data
- Innovation is terminal after `market`; future domains that need innovation or market context should soft-read them rather than reorder the pipeline (or append after innovation only when a hard Future-layer predecessor is justified)

## Commit message style

```
feat(intelligence): add Sprint NNN {Domain} Intelligence

{Why this domain exists in one or two sentences.}
```
