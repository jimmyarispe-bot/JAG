# Enterprise Connectors

**Sprint:** 078  
**Package:** `src/lib/platform/integrations/connectors/enterprise/`  
**Phase:** Integration Platform complete (exit criteria below)

## Mission

Connect operational systems — CRM, HR, Education, and Government — through the Sprint 073 Integration Platform Core. Every adapter **normalizes into existing canonical entities** before data enters JAG. Intelligence modules consume the shared Knowledge Graph; ECC never exposes provider-specific implementation details.

## Providers

| Domain | Catalog ids | Normalize |
|--------|-------------|-----------|
| CRM | `hubspot`, `salesforce` | Contacts, Companies, Deals, Activities, Pipelines |
| HR | `adp`, `gusto`, `paylocity` | Employees, Payroll, Benefits, PTO, Hiring |
| Education | `canvas`, `powerschool`, `google_classroom` | Students, Classes, Assignments, Grades, Attendance |
| Government | `state_education`, `scholarship`, `medicaid`, `grant` | Programs, Applications, Awards, Claims, Compliance |

HubSpot, Salesforce, and Gusto are promoted from placeholders (`placeholder: false`, v1.0.0). BambooHR remains a scaffold placeholder.

## Canonical Knowledge Graph

All Sprint 073–078 connectors contribute to the same ontology:

Person · Organization · Communication · Meeting · Document · Financial Transaction · Student · Employee · Initiative · Portfolio · Risk · Decision · Opportunity · Task

Node ids: `ent:{Kind}:{externalId}`. Dotted JAG types (e.g. `crm.contact`) are retained on `jagCanonicalType`.

## ECC widgets (provider-neutral)

| Widget | Surface |
|--------|---------|
| `crm_pipeline` | Pipeline value / open deals |
| `workforce` | Headcount / open roles |
| `student_enrollment` | Active students / attendance |
| `program_funding` | Awards+claims / compliance |

## Phase exit criteria

1. Every connector uses Integration Platform Core (auth, sync, health, telemetry, retries, events, normalization) without duplicating infrastructure.
2. Provider-specific data is normalized into canonical entities before entering JAG.
3. Intelligence modules consume normalized data through the shared knowledge graph — not connector APIs.
4. Lifecycle is consistent across connectors.
5. ECC surfaces insights without provider-specific implementation details.

Adding connector 25 should feel like adding connector 2.

## Registration

```ts
import {
  createIntegrationPlatformCore,
  registerEnterprisePlatformConnectors,
  buildEnterpriseEccWidgets,
  buildEnterpriseExecutiveFeed,
  ENTERPRISE_KG_KINDS,
} from "@/lib/platform/integrations";

const platform = createIntegrationPlatformCore();
registerEnterprisePlatformConnectors(platform);
await platform.syncNow("hubspot", "hubspot-org-enterprise-demo", "full");
await platform.syncNow("gusto", "gusto-org-enterprise-demo", "full");
await platform.syncNow("canvas", "canvas-org-enterprise-demo", "full");
await platform.syncNow("grant", "grant-org-enterprise-demo", "full");

const widgets = buildEnterpriseEccWidgets("exec-demo-org");
const feed = buildEnterpriseExecutiveFeed("org-enterprise-demo");
```

Also registered via `createOiosOperatingSystem()` and B4 `registerAllConnectors`.
