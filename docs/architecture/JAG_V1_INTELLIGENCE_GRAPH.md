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
| 39 | wisdom | `src/lib/platform/intelligence/wisdom/` | 060 (v1.0 terminal) |

OIOS also registers catalog keys `legal`, `compliance`, and `risk` (not active
platform modules) for possible future split of `legal-compliance-risk`.

### Hard DAG terminal chain (late graph)

```
... -> ethical -> systems -> resilience -> ecosystem
  -> institutional-memory -> collective -> wisdom
```

Wisdom hard deps: platform `["collective"]`; OIOS `["organization-dna", "collective"]`.

## 2. Architecture Validation

- [x] No circular imports between intelligence packages (leaf types/contracts; soft light types only)
- [x] Clean DAG: wisdom depends on collective; collective frozen; prior packages unmodified
- [x] Registry: `wisdom` in `INTELLIGENCE_MODULE_IDS` and OIOS active set
- [x] DI: `createWisdomIntelligence`, module adapter, `createIntelligenceService().wisdom`
- [x] Isolation: soft integrations only; no edits to collective/institutional-memory/knowledge sources
- [x] Terminal pipeline: `... institutional-memory, collective, wisdom`

## 3. Quality Validation

- [x] `npx tsc --noEmit`
- [x] `npx vitest run tests/unit/intelligence/wisdom.test.ts` (+ collective, institutional-memory, infrastructure, oios-core)
- [x] OIOS: wisdom active with deps `organization-dna`, `collective`
- [x] Dashboards: Executive Wisdom Overview plus strategic judgment, synthesis, trade-off, priorities, confidence, long-term outlook, forecast, brief, board report
- [x] Package docs: README, ARCHITECTURE, VERIFICATION, CHANGELOG
- [x] Capstone docs: this file + FUTURE_SPRINT_GUIDELINES + INTELLIGENCE_LAYER_MODEL

## 4. JAG v1.0 Summary

### Totals

- **39** active platform intelligence modules in the default pipeline
- OIOS catalog includes those domains plus reserved `legal` / `compliance` / `risk`
- Capstone domain: **wisdom** (Sprint 060)

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
11. **Wisdom** - terminal executive judgment and long-term synthesis

### Readiness for v2.0

JAG v1.0 completes the intelligence DAG terminal at wisdom. v2.0 may deepen engines,
split reserved OIOS keys, add UI surfaces, or introduce new domains **after** wisdom
only when a hard predecessor is justified; otherwise prefer soft context attachments
and do not regenerate frozen packages (see FUTURE_SPRINT_GUIDELINES).
