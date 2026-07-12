# AI Agent Architecture (on OIOS)

## Purpose

Define how AI agents operate on JAG OIOS without bypassing the permanent architecture.

## Principles

1. Agents consume **OIOS context**, not private domain stores.
2. Agents treat the digital twin as the source of organizational truth for a run.
3. Agents may propose actions; execution still flows through workflows / domain engines.
4. Agents must respect domain registry status (do not invent inactive domains).
5. Agents write learnings into Organizational Memory / Knowledge Graph via OIOS APIs.

## Context bundle for agents

From `OiosResult`:

| Field | Agent use |
|-------|-----------|
| `twin` | Current organizational reality |
| `context` | Scoped baseline + DNA link |
| `health` / `maturity` / `scorecard` | Prioritization |
| `strategy` / `objectives` | Goal alignment |
| `opportunities` / `improvementCycle` | Recommended work |
| `memory` | Prior decisions / outcomes |
| `knowledge` | Structural relationships |
| `domains` | What is active vs future |
| `governance` | Policy / standard constraints |

## Agent loop (canonical)

```
Observe (twin + context + memory)
  → Reason (within OIOS scorecard / strategy)
  → Propose (aligned to objectives / policies)
  → Act (through domain or workflow APIs)
  → Learn (memory + improvement loop measure/learn stages)
```

## Integration points

- DI: `createIntelligenceService().oios`
- Platform: `context.get("oios")` after `oios-core`
- DNA: optional enrichment already applied when DNA module ran upstream

## Non-goals

Agents must not:

- Regenerate domain packages
- Bypass governance policies/standards
- Activate future domains without a sprint registration
