# JAG OIOS Core

**Sprint 031** — Permanent Organizational Intelligence Operating System architecture.

## Quick start

```ts
import { createOiosOperatingSystem } from "@/lib/platform/oios";

const oios = createOiosOperatingSystem({
  wireOrganizationDna: true,
});

oios.operatingSystem.bootstrap({ organizationId: "org-1", schoolId: null });

const result = oios.service.build({
  requestId: "run-1",
  scope: { organizationId: "org-1", schoolId: null },
  dnaSeed: { name: "Northstar Academy", stageHint: "startup" },
});
```

Via intelligence service:

```ts
import { createIntelligenceService } from "@/lib/platform/intelligence";

const service = createIntelligenceService();
const snapshot = service.oios.service.build({ requestId: "run-1" });
```

## Capabilities

| Area | Components |
|------|------------|
| Operating system | `OrganizationOperatingSystem` |
| Domains | `IntelligenceDomainRegistry` |
| Twin / state | Digital twin, lifecycle, state engine, context |
| Cognition supports | Memory, knowledge graph |
| Improvement | Capabilities, improvement engine, continuous loop |
| Measurement | Health index, maturity, scorecard, benchmarking |
| Direction | Objectives, strategy, execution + operating models |
| Governance | Configuration, policies, standards, governance model |

## Architecture position

```
organization-dna → oios-core → organization-health → … → board-governance
```

DI entry: `createOiosOperatingSystem()`  
Platform module id: `oios-core`  
Context key: `oios`

## Docs

See `docs/architecture/JAG_OIOS_ARCHITECTURE.md` and related Sprint 031 documents.
