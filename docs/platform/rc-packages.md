# RC product packages (RC-4…RC-10)

Maintainer map for the product release packages. Distinct from **ops readiness packs** under `docs/operations/rc3|rc4|rc5|rc10` and from **launch certification** folders under `docs/launch/phase-g/rc*`.

| Label collision | Meaning |
|-----------------|---------|
| Product RC-4…RC-9 | Packages in the table below |
| Ops `docs/operations/rc4` | Role-acceptance readiness pack |
| Launch `docs/launch/phase-g/rc4` | Certification evidence pack |
| Ops `docs/operations/rc10` | Production GA readiness (verifies product RC-4…RC-9) |

## Package map

| RC | Package path | Role | Primary docs |
|----|--------------|------|--------------|
| RC-4 | `src/lib/platform/knowledge-graph/` | Unified organizational graph; connector ingest; ECC widgets; soft-read API | Module barrel JSDoc; governance Doc 59 is conceptual only |
| RC-5 | `src/lib/platform/executive-copilot/` | Copilot 2.0 — cross-domain reasoning (Ask JAG `/exec/ask`) | Barrel JSDoc; Sprint 067 doc = **intelligence** twin |
| RC-6 | `src/lib/platform/executive-command-center/` | Mission Control 2.0 / ECC | Barrel JSDoc; Sprint 068 doc = **intelligence** twin |
| RC-7 | `src/lib/platform/workflows/` | Workflow Studio | Barrel JSDoc |
| RC-8 | `src/lib/platform/marketplace/` | Extension marketplace / SDK catalog | Barrel JSDoc |
| RC-9 | `src/lib/platform/enterprise/` | Enterprise admin surfaces | Barrel JSDoc |
| RC-10 | `src/lib/platform/production/` | GA readiness helpers (no new product features) | [`docs/operations/rc10/README.md`](../operations/rc10/README.md) |

## Dual stacks (critical)

For Copilot and Command Center, **two** trees exist:

| Concern | Path |
|---------|------|
| Intelligence DAG module (Sprint 067/068) | `src/lib/platform/intelligence/{executive-copilot,executive-command-center}/` |
| Product RC package (RC-5 / RC-6) | `src/lib/platform/{executive-copilot,executive-command-center}/` |

Product packages soft-read the knowledge graph and domain feeds. Intelligence modules participate in the cognitive pipeline. Do not import vendor connector APIs from intelligence or invert the DAG into digital-twin / initiative engines.

## Digital Twin / Knowledge Graph

| Capability | Path | Notes |
|------------|------|-------|
| Organizational Digital Twin (Sprint 071) | `src/lib/platform/intelligence/digital-twin/` | Simulations only; see `docs/intelligence/digital-twin.md` |
| OIOS foundation twin | `src/lib/platform/oios/organizational-digital-twin.ts` | Frozen foundation snapshot |
| Unified Knowledge Graph (RC-4) | `src/lib/platform/knowledge-graph/` | Canonical entities + soft-reads |

## Public entry points (examples)

```ts
// Knowledge Graph soft-read
import { softReadOrganizationalGraph, searchUnifiedGraph } from "@/lib/platform/knowledge-graph";

// Copilot 2.0
import { answerExecutiveCopilotV2 } from "@/lib/platform/executive-copilot";

// Mission Control 2.0
import { buildMissionControl } from "@/lib/platform/executive-command-center";
```

Parameters, return types, and intent catalogs live next to the exports in each package (`types.ts`, `engine/`, `api.ts`). Prefer those types over inventing parallel DTOs in UI.

## Related

- Integrations / connectors: [`integrations.md`](./integrations.md)
- Intelligence module guides: [`../intelligence/`](../intelligence/)
- RC-6 quality audits: [`../releases/`](../releases/)
