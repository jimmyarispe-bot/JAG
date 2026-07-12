# Executive Graph Reasoning (Sprint 025)

## Pipeline

1. **Build** — `GraphBuilder` materializes catalog nodes + input signals + default relations
2. **Persist** — `GraphRepository.save` (in-memory, scoped)
3. **Criticality** — fan-in/out + status/severity + blocking weight
4. **Root cause** — nodes with no inbound causal edges and outbound impact / elevated pressure
5. **Dependency** — `DEPENDS_ON` plus structural fan metrics
6. **Cascade** — bounded BFS/DFS multi-hop paths (default depth 4)
7. **Risk propagation** — negative / high-impact cascades from stressed origins
8. **Constraints** — `BLOCKS` / vacancies / cash / compliance
9. **Opportunities** — `SUPPORTS` / `IMPROVES` / opportunity nodes
10. **Reason** — narrative `ExecutiveFinding`s
11. **Prioritize** — `ExecutivePriority` ranking
12. **Project** — recommendations + `DashboardProjection`

## Determinism

All scoring is pure and evidence-backed. No LLM calls. Confidence is calibrated via additive factors clamped to `[0, 1]`.

## Query layer

`ExecutiveQueries.ask` answers:

- root cause / why
- risk
- opportunity
- priority
- domain-focused critical signals

`GraphSearch` supports label/key search, neighborhood expansion, and shortest outbound path.

## Dashboard projection

Flattened package for UI:

- headline
- overall risk / opportunity
- top priorities, root causes, opportunities
- active constraints
- per-domain summaries
- graph metrics

## Extension points

Inject replacements via `ExecutiveGraphAnalyzerDependencies` / `createExecutiveGraphAnalyzer(options)`.
