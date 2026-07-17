# Intelligence Surfaces Map

| Field | Value |
|-------|--------|
| **Phase** | B (H-A1) |
| **Date** | 2026-07-17 |
| **Purpose** | Tell engineers which intelligence package to use in ≤5 minutes |

---

## Quick picker

| If you need… | Use | Path |
|--------------|-----|------|
| Terminal organizational judgment / wisdom | **OIOS** (Exec Command Center) | `src/lib/platform/intelligence/**`, `/exec/**` |
| LLM provider / prompt / queue governance | **AIP** | `src/lib/intelligence-platform/**` |
| Comparative benchmarks / network views | **Intelligence Network** | `src/lib/intelligence-network/**` |
| Enterprise diagnostic scorecards / briefings | **EDI** | `src/lib/edi/**` |
| GL / financial intelligence product tables | **Financial Intelligence** | `src/lib/financial-intelligence/**` |
| CEO operating surface (widgets + provenance) | **Exec** | `src/app/exec/**`, `src/lib/exec/**` |
| Mission Control ops command center | **Automation / MC** | `src/lib/platform/automation/**` |
| Platform workflow state machines | **workflow** (singular) | `src/lib/platform/workflow/**` |
| Executive domain lifecycle workflows | **executive-workflows** | `src/lib/platform/executive-workflows/**` (legacy alias: `workflows`) |

---

## Authority rules

1. **OIOS module IDs** — `INTELLIGENCE_MODULE_IDS` in `src/lib/platform/intelligence/infrastructure/types.ts`  
2. **Product claims** — [PRODUCTION_INTELLIGENCE_CONTRACT.md](../phase-a/PRODUCTION_INTELLIGENCE_CONTRACT.md)  
3. **Do not** treat AIP / EDI / FI / Network as substitutes for OIOS wisdom  
4. **Prefer subpath imports** for OIOS domains — avoid new `@/lib/platform/intelligence` mega-barrel imports (H-A11)

---

## OIOS vs catalog notes (M-A5)

Live DAG authority is `INTELLIGENCE_MODULE_IDS` (39 modules, terminal `wisdom`).

Historical `OIOS_INTELLIGENCE_DOMAINS` / `INTELLIGENCE_DOMAIN_MODEL.md` may lag — treat as archaeology. See [architecture README](../README.md).

| Layer (conceptual) | Example module IDs |
|--------------------|--------------------|
| Foundation | `organization-dna`, `oios-core`, `organization-health` |
| Product / human / finance | `financial`, `human-capital`, `revenue`, `funding`, `opportunity`, … |
| External | `market`, `competitive`, `political`, `environmental`, … |
| Relational / systems | `stakeholder`, `systems`, `resilience`, `ecosystem` |
| Memory → Collective → Wisdom | `institutional-memory`, `collective`, `wisdom` |

---

## Dual stacks (intentional — do not merge casually)

| Pair | ADR / note |
|------|------------|
| `platform/executive-graph` vs `intelligence/executive-graph` | ADR-A1-001 |
| `lib/finance` vs `platform/finance` / `accounting` | ADR-A1-002 |
| `platform/workflow` vs `executive-workflows` | H-A2 (Phase B) |
