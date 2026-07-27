# Future Sprint Guidelines (OIOS)

## Purpose

Rules every future intelligence sprint must follow so JAG OIOS remains coherent.

## Non-negotiables

1. **Do not regenerate** existing packages (`organization-dna`, health, founder, graph, decision, predictive, board-governance, infrastructure, oios, human-capital, revenue, funding, opportunity, organizational-improvement, business-model, operations, customer, knowledge, document, legal-compliance-risk, market, innovation, impact, economic, competitive, political, environmental, stakeholder, reputation, behavioral, cultural, ethical, systems, resilience, ecosystem, institutional-memory, collective, wisdom, synthesis, briefing, executive-memory, decision-intelligence, executive-predictive, executive-autonomous, executive-copilot, executive-command-center, initiative-intelligence, portfolio-intelligence, digital-twin, ecosystem-intelligence). Notes: Sprint 009 `intelligence/memory` stays frozen (063 = `executive-memory`); early cognitive `intelligence/decision` stays frozen (064 = `decision-intelligence`); Sprint 028 `predictive-intelligence` / module `predictive` stays frozen (065 = `executive-predictive`); early `orchestrator` / operations automation stay frozen (066 = `executive-autonomous`); legacy `lib/executive/command-center` + Mission Control stay frozen (068 = `executive-command-center`); `domains/strategic`, `execution/initiatives`, board-governance initiative tracker, and executive-memory initiative entities stay frozen (069 = `initiative-intelligence`); `innovation/innovation-portfolio-intelligence` stays frozen (070 = `portfolio-intelligence`); OIOS foundation `OrganizationalDigitalTwin` stays frozen (071 = `digital-twin`); Sprint 057 mid-pipeline `ecosystem` stays frozen (072 terminal = `ecosystem-intelligence`).
2. **Extend** via new domain packages + DI + platform module registration.
3. **Register** domains in the OIOS catalog before claiming them active.
4. **Keep leaf modules leaf** (`types` / `contracts` import-free of implementations).
5. **Prove** with `npx tsc --noEmit`, unit tests, and pipeline order assertions.
6. **Place domains** using the three-layer model in
   [INTELLIGENCE_LAYER_MODEL.md](./INTELLIGENCE_LAYER_MODEL.md) (Internal /
   External / Future).
7. **Respect the executive stack** — `wisdom` remains the JAG v1.0 judgment capstone;
   `synthesis` (061) → `briefing` (062) → `executive-memory` (063) →
   `decision-intelligence` (064) → `executive-predictive` (065) →
   `executive-autonomous` (066) → `executive-copilot` (067) →
   `executive-command-center` (068) → `initiative-intelligence` (069) →
   `portfolio-intelligence` (070) → `digital-twin` (071) → `ecosystem-intelligence` (072). Prefer soft reads of these
   layers unless a new hard predecessor is justified. See
   [JAG_V1_INTELLIGENCE_GRAPH.md](./JAG_V1_INTELLIGENCE_GRAPH.md) and
   [docs/intelligence/digital-twin.md](../intelligence/digital-twin.md).

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
- **Sprint 057 (Intelligence track):** Ecosystem Intelligence (External/network layer after Resilience, hard dep: resilience)  
  - **Note:** **Sprint 057 (Platform architecture track)** is [JAG Platform Alignment](./platform-alignment/) — Platform / Application / Tenant. Always name the track when citing Sprint 057.
- **Sprint 058 (Intelligence track):** Institutional Memory Intelligence (Knowledge evolution terminal layer after Ecosystem; Sprint 040 knowledge remains mid-pipeline frozen; hard dep: ecosystem)  
  - **Note:** **Sprint 058 (Platform ops track)** is [Canonical Deployment Alignment](./platform-alignment/sprint-058/) — one Vercel project (`academy-os`). Always name the track when citing Sprint 058.
- **Sprint 059 (Intelligence track):** Collective Intelligence (collaborative synthesis layer after Institutional Memory; hard dep: institutional-memory)
  - **Note:** **Sprint 059 (Platform architecture track)** is [Application Registry & Enablement](./platform-alignment/sprint-059/) — `platform_applications` + tenant enablement. Always name the track when citing Sprint 059.
- **Sprint 060:** Wisdom Intelligence (JAG v1.0 judgment capstone after Collective; hard dep: collective)
- **Sprint 061:** Executive Synthesis Intelligence (cross-domain reasoning layer after Wisdom; hard dep: wisdom)
- **Sprint 062:** Executive Briefing Intelligence (actionable morning briefs after Synthesis; hard dep: synthesis)
- **Sprint 063:** Executive Memory Intelligence (structured reasoning memory after Briefing; hard dep: briefing; package path `executive-memory`)
- **Sprint 064:** Decision Intelligence (multi-option decision support after Executive Memory; hard dep: executive-memory; package path `decision-intelligence`)
- **Sprint 065:** Predictive Intelligence (organizational forecasting after Decision Intelligence; hard dep: decision-intelligence; package path `executive-predictive`)
- **Sprint 066:** Autonomous Intelligence (execution preparation after Predictive; hard dep: executive-predictive; package path `executive-autonomous`; never auto-executes)
- **Sprint 067:** Executive Copilot (conversational orchestration after Autonomous; hard dep: executive-autonomous; package path `executive-copilot`)
- **Sprint 068:** Executive Command Center (role-prioritized workspace after Copilot; hard dep: executive-copilot; package path `executive-command-center`)
- **Sprint 069:** Initiative Intelligence (strategic execution layer after Command Center; hard dep: executive-command-center; package path `initiative-intelligence`)
- **Sprint 070:** Portfolio Intelligence (enterprise portfolio layer after Initiatives; hard dep: initiative-intelligence; package path `portfolio-intelligence`)
- **Sprint 071:** Organizational Digital Twin (strategic sandbox after Portfolio; hard dep: portfolio-intelligence; package path `digital-twin`)
- **Sprint 072:** Ecosystem Intelligence Federation (terminal federation layer after Digital Twin; hard dep: digital-twin; package path `ecosystem-intelligence`)

## Future domains (reserved — next sprint candidates)

JAG v1.0 judgment completes at `wisdom`. Sprints 061–072 add synthesis → briefing →
executive-memory → decision-intelligence → executive-predictive → executive-autonomous →
executive-copilot → executive-command-center → initiative-intelligence →
portfolio-intelligence → digital-twin → ecosystem-intelligence. Future sprints (073+) should soft-read
ecosystem-intelligence unless a new hard DAG edge is required. See
[docs/intelligence/ecosystem-intelligence.md](../intelligence/ecosystem-intelligence.md).

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
