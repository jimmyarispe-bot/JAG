# JAG Decision Engine

**Universal, industry-agnostic policy evaluation for The JAG OS.**

Packages register **decision definitions**. JAG evaluates them deterministically.  
Other engines (Process, Workflow, …) **consume** outcomes — this engine does not orchestrate processes or transition workflow state.

## Layout

| Path | Responsibility |
|------|----------------|
| `contracts/` | Immutable types + extension ports |
| `registry/` | Definition registration & dependency validation |
| `runtime/` | `DecisionRuntime` — evaluate / simulate / explain / validate / compare |
| `evaluation/` | Deterministic evaluation pipeline |
| `context/` | Fact paths + evaluation context cache |
| `policies/` | Conditions, rule groups, precedence, conflict resolution |
| `results/` | Machine-readable explanations (no LLM) |
| `telemetry/` | Evaluation / simulation / policy-change events |
| `persistence/` | Repository **interfaces only** |
| `testing/` | Deterministic test helpers |

## Public entry

```ts
import {
  DecisionRegistry,
  DecisionRuntime,
  bindDecisionExtensions,
} from "@/jag/decisions";
```

## Rules

1. Decisions evaluate; processes orchestrate; workflows transition state.
2. No package imports inside this engine.
3. Extensions only through `DecisionExtensionPorts`.
4. Explanations are structured — never LLM-backed.

## Docs

`docs/jag-os/decisions/`
