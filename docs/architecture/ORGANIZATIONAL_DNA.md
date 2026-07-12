# Organizational DNA & Company Builder — Architecture

## Purpose

Provide a durable **Organizational DNA** genotype and **Company Builder** pipeline so JAG can operate an organization from first idea through exit / succession.

## Pipeline position

```
organization-dna
  → organization-health → financial → founder → executive
  → executive-graph → executive-decision → predictive
  → board-governance
```

`organization-dna` is foundational (no module dependencies). Downstream modules may read context key `organizationDna`. When invoked via `OrganizationService` with upstream results supplied on the request, DNA enrichs from graph / decision / predictive / governance signals.

## Core types

| Type | Role |
|------|------|
| `OrganizationDNA` | Canonical genotype consumed by future domains |
| `OrganizationProfile` | Identity, culture, goals, capabilities |
| `CompanyBuilderSeed` | Idea / startup input |
| `OrganizationDnaResult` | Full run output + artifacts |
| `OrganizationStage` | idea / startup / operating / growth / turnaround / acquisition / exit |

## DI

```ts
createOrganizationDnaIntelligence(options?) → OrganizationDnaStack
```

Stack fields: `service`, `engine`, `graphAnalyzer`, `decision`, `predictive`, `boardGovernance`.

## Integration

| Module | Integration |
|--------|-------------|
| Founder / Executive / Graph | Optional `graphInput` / analysis on request |
| Executive Decision | Optional `decisionResult` |
| Predictive | Optional `predictionResult` |
| Board Governance | Optional `governanceResult` |
| Platform Infrastructure | Module id `organization-dna`, context `organizationDna` |
