# Executive Workspace (Wave 1.6)

**Product experience layer** — presentation and orchestration over canonical platform services.  
**Does not** create engines or duplicate Finance, Learning Intelligence, Knowledge, reporting, or strategy logic.

## Surfaces (`/dashboard/executive`)

| Area | Route |
|------|-------|
| Home (Command Center) | `/dashboard/executive` |
| Multi-school | `/dashboard/executive/multi-school` |
| Academics | `/dashboard/executive/academics` |
| Operations | `/dashboard/executive/operations` |
| Finance (read-only) | `/dashboard/executive/finance` |
| People | `/dashboard/executive/people` |
| Strategy | `/dashboard/executive/strategy` |
| Innovation | `/dashboard/executive/innovation` |
| Org intelligence | `/dashboard/executive/intelligence` |
| Reports | `/dashboard/executive/reports` |
| Communications | `/dashboard/executive/communications` |
| Profile | `/dashboard/executive/profile` |

Existing intelligence tools (board, KPIs, briefings, forecasting, risk, network, etc.) remain under `/dashboard/executive/*`.

## Orchestration

`src/lib/executive/experience/`

- Home composition from KPIs / morning brief / network / command metrics
- Multi-school, academics (LI), operations, finance/CFO read-only, people (HR), StrategyEngine, InnovationEngine, memory/twin intelligence
- Events → Twin, Evidence, Memory

## Engines consumed

Organization · Identity · Finance · CFO · Learning Intelligence · Knowledge · Innovation · Strategy · Reporting · Workflow · Communications · Notifications · Twin · Evidence · Memory

## Tests

`tests/unit/executive/wave16-executive-experience.test.ts`
