# Digital Twin Architecture

## Purpose

The **Organizational Digital Twin** is the live operating-system projection of the organization — lifecycle, state, domain signals, and DNA linkage.

## Core type

```ts
interface DigitalTwinSnapshot {
  id: string;
  scope: OiosScope;
  lifecycle: OiosLifecyclePhase;
  state: OrganizationalState;
  domainSignals: Record<string, number>;
  updatedAt: string;
  metadata: OiosMetadata;
}
```

## Construction

`OrganizationalDigitalTwin.snapshot()` builds from:

1. Scope (organization / school)
2. Derived organizational state (lifecycle, scores, active domains, risks)
3. Domain signal map (health, maturity, scorecard measures, …)
4. Optional Organizational DNA reference (`metadata.dnaId`)

## Relationship to OIOS

```
DNA genotype
  → State Engine + Lifecycle
  → Digital Twin snapshot
  → Context / Memory / Knowledge Graph
  → Scorecard / Strategy / Improvement Loop
```

## Update model

- Twin is rebuilt on each `OiosService.build` / platform `oios-core` execution.
- Memory retains prior build summaries.
- Knowledge graph links organization → strategy and expands as domains contribute nodes.

## Consumers

- AI agents (read-only twin + context)
- Executive / board surfaces
- Continuous improvement loop
- Future domain enrichment (read `context.get("oios").twin`)
