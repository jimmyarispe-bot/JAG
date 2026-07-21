# JAG v1.0 Intelligence Graph

Capstone documentation for Sprint 060 Wisdom Intelligence. Source of truth for
domain keys and pipeline order: `INTELLIGENCE_MODULE_IDS` and
`OIOS_INTELLIGENCE_DOMAINS`.

## 1. Intelligence Graph Summary

### Pipeline dependency order (platform modules)

Order matches `INTELLIGENCE_MODULE_IDS` / default module provider registration:

| # | Domain key | Package path | Sprint (approx) |
|---|------------|--------------|-----------------|
| 1 | organization-dna | `src/lib/platform/intelligence/organization-dna/` | foundation |
| 2 | oios-core | `src/lib/platform/oios/` | foundation |
| 3 | organization-health | `src/lib/platform/intelligence/organization-health/` | foundation |
| 4 | financial | `src/lib/platform/intelligence/financial/` | early product |
| 5 | founder | `src/lib/platform/intelligence/founder/` | early product |
| 6 | executive | `src/lib/platform/intelligence/domains/executive/` | product |
| 7 | executive-graph | `src/lib/platform/intelligence/executive-graph/` | product |
| 8 | executive-decision | `src/lib/platform/intelligence/executive-decision/` | product |
| 9 | predictive | `src/lib/platform/intelligence/predictive-intelligence/` | product / foresight bridge |
| 10 | board-governance | `src/lib/platform/intelligence/board-governance/` | product |
| 11 | human-capital | `src/lib/platform/intelligence/human-capital/` | product |
| 12 | revenue | `src/lib/platform/intelligence/revenue/` | product |
| 13 | funding | `src/lib/platform/intelligence/funding/` | product |
| 14 | opportunity | `src/lib/platform/intelligence/opportunity/` | product / Future bridge |
| 15 | organizational-improvement | `src/lib/platform/intelligence/organizational-improvement/` | product |
| 16 | business-model | `src/lib/platform/intelligence/business-model/` | product |
| 17 | operations | `src/lib/platform/intelligence/operations/` | product |
| 18 | customer | `src/lib/platform/intelligence/customer/` | product |
| 19 | knowledge | `src/lib/platform/intelligence/knowledge/` | product |
| 20 | document | `src/lib/platform/intelligence/document/` | product |
| 21 | legal-compliance-risk | `src/lib/platform/intelligence/legal-compliance-risk/` | ~042 governance |
| 22 | market | `src/lib/platform/intelligence/market/` | 043 External |
| 23 | innovation | `src/lib/platform/intelligence/innovation/` | 044 Future |
| 24 | impact | `src/lib/platform/intelligence/impact/` | 045 Future |
| 25 | economic | `src/lib/platform/intelligence/economic/` | 046 External |
| 26 | competitive | `src/lib/platform/intelligence/competitive/` | 047 External |
| 27 | political | `src/lib/platform/intelligence/political/` | 048 External |
| 28 | environmental | `src/lib/platform/intelligence/environmental/` | 049 External |
| 29 | stakeholder | `src/lib/platform/intelligence/stakeholder/` | 050 relationship |
| 30 | reputation | `src/lib/platform/intelligence/reputation/` | 051 relationship |
| 31 | behavioral | `src/lib/platform/intelligence/behavioral/` | 052 |
| 32 | cultural | `src/lib/platform/intelligence/cultural/` | 053 |
| 33 | ethical | `src/lib/platform/intelligence/ethical/` | 054 |
| 34 | systems | `src/lib/platform/intelligence/systems/` | 055 |
| 35 | resilience | `src/lib/platform/intelligence/resilience/` | 056 |
| 36 | ecosystem | `src/lib/platform/intelligence/ecosystem/` | 057 |
| 37 | institutional-memory | `src/lib/platform/intelligence/institutional-memory/` | 058 |
| 38 | collective | `src/lib/platform/intelligence/collective/` | 059 |
| 39 | wisdom | `src/lib/platform/intelligence/wisdom/` | 060 (v1.0 judgment capstone) |
| 40 | synthesis | `src/lib/platform/intelligence/synthesis/` | 061 (executive reasoning layer) |
| 41 | briefing | `src/lib/platform/intelligence/briefing/` | 062 (executive briefing surface) |
| 42 | executive-memory | `src/lib/platform/intelligence/executive-memory/` | 063 (executive reasoning memory) |
| 43 | decision-intelligence | `src/lib/platform/intelligence/decision-intelligence/` | 064 (decision support) |
| 44 | executive-predictive | `src/lib/platform/intelligence/executive-predictive/` | 065 (predictive intelligence) |
| 45 | executive-autonomous | `src/lib/platform/intelligence/executive-autonomous/` | 066 (autonomous preparation) |
| 46 | executive-copilot | `src/lib/platform/intelligence/executive-copilot/` | 067 (executive copilot) |
| 47 | executive-command-center | `src/lib/platform/intelligence/executive-command-center/` | 068 (command center workspace) |
| 48 | initiative-intelligence | `src/lib/platform/intelligence/initiative-intelligence/` | 069 (strategic initiatives) |
| 49 | portfolio-intelligence | `src/lib/platform/intelligence/portfolio-intelligence/` | 070 (enterprise portfolio) |
| 50 | digital-twin | `src/lib/platform/intelligence/digital-twin/` | 071 (organizational digital twin) |
| 51 | ecosystem-intelligence | `src/lib/platform/intelligence/ecosystem-intelligence/` | 072 (ecosystem federation terminal) |

OIOS also registers catalog keys `legal`, `compliance`, and `risk` (not active
platform modules) for possible future split of `legal-compliance-risk`.

### Hard DAG terminal chain (late graph)

```
... -> ethical -> systems -> resilience -> ecosystem
  -> institutional-memory -> collective -> wisdom -> synthesis -> briefing -> executive-memory -> decision-intelligence -> executive-predictive -> executive-autonomous -> executive-copilot -> executive-command-center -> initiative-intelligence -> portfolio-intelligence -> digital-twin -> ecosystem-intelligence
```

Wisdom hard deps: platform `["collective"]`; OIOS `["organization-dna", "collective"]`.  
Synthesis hard deps: platform `["wisdom"]`; OIOS `["organization-dna", "wisdom"]`.  
Briefing hard deps: platform `["synthesis"]`; OIOS `["organization-dna", "synthesis"]`.  
Executive Memory hard deps: platform `["briefing"]`; OIOS `["organization-dna", "briefing"]`.  
Decision Intelligence hard deps: platform `["executive-memory"]`; OIOS `["organization-dna", "executive-memory"]`.  
Predictive Intelligence hard deps: platform `["decision-intelligence"]`; OIOS `["organization-dna", "decision-intelligence"]`.  
Autonomous Intelligence hard deps: platform `["executive-predictive"]`; OIOS `["organization-dna", "executive-predictive"]`.  
Executive Copilot hard deps: platform `["executive-autonomous"]`; OIOS `["organization-dna", "executive-autonomous"]`.  
Executive Command Center hard deps: platform `["executive-copilot"]`; OIOS `["organization-dna", "executive-copilot"]`.  
Initiative Intelligence hard deps: platform `["executive-command-center"]`; OIOS `["organization-dna", "executive-command-center"]`.  
Portfolio Intelligence hard deps: platform `["initiative-intelligence"]`; OIOS `["organization-dna", "initiative-intelligence"]`.  
Digital Twin hard deps: platform `["portfolio-intelligence"]`; OIOS `["organization-dna", "portfolio-intelligence"]`.  
Ecosystem Intelligence hard deps: platform `["digital-twin"]`; OIOS `["organization-dna", "digital-twin"]`.

## 2. Architecture Validation

- [x] No circular imports between intelligence packages (leaf types/contracts; soft light types only)
- [x] Clean DAG: wisdom → … → portfolio-intelligence → digital-twin → ecosystem-intelligence
- [x] Registry: late stack ids in `INTELLIGENCE_MODULE_IDS` and OIOS active set
- [x] DI: factories, module adapters, service stacks for each late-layer domain
- [x] Isolation: soft integrations only; OIOS foundation twin + innovation portfolio frozen
- [x] Terminal pipeline: `... initiative-intelligence, portfolio-intelligence, digital-twin, ecosystem-intelligence`

## 3. Quality Validation

- [x] `npx tsc --noEmit`
- [x] `npx vitest run tests/unit/intelligence/wisdom.test.ts` (+ collective, institutional-memory, infrastructure, oios-core)
- [x] OIOS: wisdom active with deps `organization-dna`, `collective`
- [x] Dashboards: Executive Wisdom Overview plus strategic judgment, synthesis, trade-off, priorities, confidence, long-term outlook, forecast, brief, board report
- [x] Package docs: README, ARCHITECTURE, VERIFICATION, CHANGELOG
- [x] Capstone docs: this file + FUTURE_SPRINT_GUIDELINES + INTELLIGENCE_LAYER_MODEL

## 4. JAG v1.0 Summary

### Totals

- **51** active platform intelligence modules in the default pipeline
- OIOS catalog includes those domains plus reserved `legal` / `compliance` / `risk`
- Judgment capstone: **wisdom** (060); then synthesis (061) → briefing (062) → executive-memory (063) → decision-intelligence (064) → executive-predictive (065) → executive-autonomous (066) → executive-copilot (067) → executive-command-center (068) → initiative-intelligence (069) → portfolio-intelligence (070) → digital-twin (071) → ecosystem-intelligence (072)

### Achievements

- End-to-end organizational intelligence graph from DNA through executive wisdom
- Soft-integration discipline preserved (leaf light types, no circular hard edges)
- Closed learning loops redistribute insights without regenerating frozen packages
- Executive Judgment Framework on wisdom briefs (what / why / why now / alternatives / risks / assumptions / evidence / expected outcome)

### Reasoning layers (v1.0 narrative)

1. **Foundation** - organization-dna, oios-core, organization-health
2. **Product** - financial through document / legal-compliance-risk
3. **External** - market through environmental (+ ecosystem later)
4. **Future** - innovation, impact (+ predictive/opportunity bridges)
5. **Relationship** - stakeholder, reputation
6. **Behavioral / cultural / ethical** - behavioral, cultural, ethical
7. **Systems / resilience** - systems, resilience
8. **Ecosystem** - ecosystem
9. **Memory** - institutional-memory (knowledge mid-pipeline remains frozen)
10. **Collective** - collective synthesis
11. **Wisdom** - executive judgment and long-term synthesis
12. **Synthesis** - cross-domain reasoning layer (Sprint 061)
13. **Briefing** - actionable executive briefing surface (Sprint 062)
14. **Executive Memory** - structured reasoning memory (Sprint 063)
15. **Decision Intelligence** - multi-option decision support (Sprint 064)
16. **Predictive Intelligence** - organizational forecasting & scenarios (Sprint 065)
17. **Autonomous Intelligence** - execution preparation, human-in-the-loop (Sprint 066)
18. **Executive Copilot** - conversational orchestration (Sprint 067)
19. **Executive Command Center** - role-prioritized workspace (Sprint 068)
20. **Initiative Intelligence** - strategic execution system of record (Sprint 069)
21. **Portfolio Intelligence** - enterprise portfolio governance (Sprint 070)
22. **Organizational Digital Twin** - strategic sandbox simulations (Sprint 071)
23. **Ecosystem Intelligence Federation** - terminal ecosystem federation layer (Sprint 072)

### Readiness for v2.0

Judgment completes at wisdom; synthesis → … → portfolio-intelligence →
digital-twin → ecosystem-intelligence form the executive stack. v2.0 may deepen engines, add surfaces
(073+), split reserved OIOS keys, or introduce new domains after ecosystem-intelligence
only when a hard predecessor is justified; otherwise prefer soft context
attachments and do not regenerate frozen packages.

See also:
[docs/intelligence/executive-synthesis.md](../intelligence/executive-synthesis.md),
[docs/intelligence/executive-briefing.md](../intelligence/executive-briefing.md),
[docs/intelligence/executive-memory.md](../intelligence/executive-memory.md),
[docs/intelligence/decision-intelligence.md](../intelligence/decision-intelligence.md),
[docs/intelligence/predictive-intelligence.md](../intelligence/predictive-intelligence.md),
[docs/intelligence/autonomous-intelligence.md](../intelligence/autonomous-intelligence.md),
[docs/intelligence/executive-copilot.md](../intelligence/executive-copilot.md),
[docs/intelligence/executive-command-center.md](../intelligence/executive-command-center.md),
[docs/intelligence/initiative-intelligence.md](../intelligence/initiative-intelligence.md),
[docs/intelligence/portfolio-intelligence.md](../intelligence/portfolio-intelligence.md),
[docs/intelligence/digital-twin.md](../intelligence/digital-twin.md).
