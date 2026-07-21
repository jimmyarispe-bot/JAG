# Ecosystem Intelligence (Sprint 072)

**Sprint:** 072  
**Domain:** Ecosystem Intelligence  
**Version:** 0.1.0  
**Module id:** `ecosystem-intelligence`  
**Package:** `src/lib/platform/intelligence/ecosystem-intelligence/`  
**Factory:** `createEcosystemFederation` (Sprint 057 owns `createEcosystemIntelligence`)

## Purpose

Governed ecosystem awareness across organizations — school networks, foundations, subsidiaries, vendors, partners — without multi-tenant data leakage.

Raw operational data stays inside owning tenants. Federation operates on authorized summaries, shared metadata, aggregated KPIs, and explicit relationships.

## Namespace verification

| Existing | Action |
|---|---|
| Sprint 057 `ecosystem/` (module #36) | Preserved — external network intelligence |
| Constitution `docs/constitution/ecosystem-intelligence/` | Preserved — philosophy only |
| `federation` / `network-intelligence` / `organization-network` | Available — unused |

## Federation architecture

```
ecosystem-intelligence/
  engine/       ecosystem, federation, relationship, aggregation, governance
  federation/   permissions, summaries, tenants, synchronization
  models/       ecosystem, organization-node, relationship, governance
  services/     ecosystem-service
```

Hard DAG predecessor: `digital-twin`.

## Permission model

- Actor home organization is always visible.
- Peer organizations require an active sharing agreement **and** an ecosystem-capable role (`ceo`, `founder`, `board`, `executive`, `ecosystem_admin`, `network_admin`).
- Unauthorized organizations are omitted from results (never error-leaked).
- Every federation decision is audited.

## Ecosystem graph

Nodes: organizations, schools, foundations, business units, vendors, partners, agencies, investors, boards, community orgs.  
Edges: parent/subsidiary, partnership, vendor, grant collaboration, shared initiative/service, network membership, holding.

## Governance

Recommendations are advisory:

- `advisoryOnly: true`
- `humanAuthorizationRequired: true`
- `mayAutoExecute: false`

Respects Sprint 066 governance.

## Aggregation strategy

Every ecosystem metric lists `contributingOrganizationIds`. Aggregates never include excluded tenants.

## Integration diagram

```
… → portfolio-intelligence
     → digital-twin
     → ecosystem-intelligence
```

## ECC widgets

Ecosystem Health, Cross-Organization Risks, Shared Opportunities, Geographic Coverage, Federated Portfolio, Organization Network.

## Extension guide

1. Add relationship kinds / risk detectors under `engine/relationship-engine.ts`.
2. Soft-read new lights in `types.ts` only — no peer engine imports.
3. Keep contract-driven federation; never pull raw tenant records.
4. Do not regenerate Sprint 057 `ecosystem/` package.

## Tests

```bash
npx vitest run tests/unit/intelligence/ecosystem-intelligence.test.ts
```
