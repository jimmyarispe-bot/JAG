# 06 — Cognitive Runtime Implementation

**Phase Ω-6** · Package: `src/lib/jag/runtime/cognition`  
**Authority:** [04_COGNITIVE_RUNTIME.md](../04_COGNITIVE_RUNTIME.md) · Extensions: [09_RUNTIME_EXTENSION_MODEL.md](../09_RUNTIME_EXTENSION_MODEL.md)

---

## Constitutional gate

| Question | Answer |
|----------|--------|
| Domain knowledge? | **No** |
| Duplicate intelligence engine? | **No** — orchestrates providers only |
| Bypass Runtime? | **No** — Cognition stage |
| Requires LLM? | **No** |
| Education-specific? | **No** |

---

## Architecture

```text
Identity × Context × Intent
    ↓
CognitiveProvider[] (registered — none by default)
    ↓ gatherEvidence / analyze / recommend
EvidenceCollector → ReasoningGraph → RecommendationEngine
    ↓
ConflictResolver → PriorityEngine
    ↓
CognitiveResult  →  ctx.cognition (Experience bag)
```

The Cognitive Runtime **coordinates** intelligence.  
Existing engines remain the source of truth via adapters.

It does **not** create intelligence, execute actions, or mutate domain state.

---

## Reasoning lifecycle

1. **Start** — trace step  
2. **Collect evidence** — provider `gatherEvidence` (deduped)  
3. **Analyze** — provider `analyze` → findings + graph nodes  
4. **Recommend** — provider `recommend` → drafts  
5. **Normalize** — Law 7 (no evidence ⇒ unsupported / no action)  
6. **Conflict detect** — same topic, divergent actions  
7. **Prioritize** — order for Experience  
8. **Unknown gaps** — honest “I don’t know”  
9. **Publish events** · bind pipeline cognition bag  

---

## Provider model

```ts
runtime.registry.registerCognitiveProvider({
  id: "adapter.example",
  capabilities: ["risk"],
  gatherEvidence(request) { return [/* CognitiveEvidenceRef */]; },
  analyze(request, evidence) { return [/* CognitiveFinding */]; },
  recommend(request, evidence, findings) { return [/* drafts */]; },
});
```

**No providers are registered by Core.** Finance, Learning, Strategy, Twin, etc. register later as adapters.

---

## Evidence model

```text
CognitiveEvidenceRef { source, id, retrievedAt, hash? }
```

Every actionable recommendation requires ≥1 evidence ref (Law 7).

---

## Recommendation model

```text
CognitiveRecommendation {
  id, type, priority, confidence,
  evidenceRefs[], reasoningNodeIds[],
  sourceProviderId, suggestedNextAction?,
  conflictFlags[], unsupported?
}
```

Types: `informational` · `actionable` · `warning` · `opportunity` · `unknown`

---

## Reasoning graph

Nodes: `observation` · `evidence` · `finding` · `risk` · `opportunity` · `recommendation` · `decision_candidate`  

Edges: `supports` · `contradicts` · `depends_on` · `causes` · `blocks` · `strengthens` · `weakens`  

No domain semantics on nodes/edges.

---

## Pipeline

```text
Identity → Context → Intent → Cognition → Experience → Action
```

```ts
installCognitiveRuntime(jag);
// result.cognition — bag for Experience briefingFromCognition
// result.data.cognitiveResult — full CognitiveResult
```

Experience consumes cognition; it does not re-implement ranking.

---

## Events

| Event | When |
|-------|------|
| `jag.runtime.cognition.evidence_collected` | Evidence gather done |
| `jag.runtime.cognition.reasoning_completed` | Think finished |
| `jag.runtime.cognition.recommendation_generated` | Rec normalized |
| `jag.runtime.cognition.conflict_detected` | Rival recommendations |
| `jag.runtime.cognition.confidence_changed` | Reserved / scoring hooks |
| `jag.runtime.cognition.provider_failed` | Isolated provider error |

---

## Extension model

Register only. Core never imports Finance/Learning/HR/Education engines.

---

## Tests

`tests/unit/jag/runtime/cognition.test.ts`

---

## Out of scope

OpenAI · Anthropic · prompts · embeddings · vector search · NLP · business rules · Education · UI · Action execution
