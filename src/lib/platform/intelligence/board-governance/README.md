# Board & Governance Intelligence (Sprint 029)

Governance layer for the JAG Executive Intelligence Platform. Converts Executive, Decision, and Predictive intelligence into board-ready reporting, strategic oversight, compliance monitoring, and governance workflows.

## Quick start

```ts
import { createBoardGovernanceIntelligence } from "@/lib/platform/intelligence/board-governance";

const { service } = createBoardGovernanceIntelligence({
  createId: (prefix) => `${prefix}-demo`,
  now: () => new Date("2026-07-12T12:00:00.000Z"),
});

const result = service.generate({
  requestId: "gov-1",
  question: "What should the board review this month?",
  scope: { organizationId: "org-1", schoolId: "school-1" },
});

console.log(result.brief.headline);
console.log(result.packets.map((p) => p.kind));
```

Via the master service:

```ts
import { createIntelligenceService } from "@/lib/platform/intelligence";

const service = createIntelligenceService();
const packet = service.boardGovernance.service.generatePacket(
  "monthly_board_packet"
);
```

## Capabilities

| Capability | Implementation |
|------------|----------------|
| Monthly Board Packet | `BoardPacketGenerator` |
| Quarterly Strategic Review | `BoardPacketGenerator` |
| Executive KPI Summary | `BoardKPIDashboard` + packets |
| Financial Summary | packet kind `financial_summary` |
| Risk Heat Map | `RiskRegister.heatMap` |
| Strategic Initiative Status | `StrategicInitiativeTracker` |
| Governance Dashboard | `GovernanceDashboard` |
| Mission Scorecard | packet + `ExecutiveScorecards` |
| Compliance Summary | `ComplianceMonitor` |
| Executive Briefing | `ExecutiveBriefGenerator` |

## Architecture position

```
organization-health → financial → founder → executive
  → executive-graph → executive-decision → predictive
  → board-governance
```

## DI entry

`createBoardGovernanceIntelligence()` — also attached on `createIntelligenceService().boardGovernance` and registered as platform module `board-governance`.
