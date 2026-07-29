# 04 — Intent Runtime Implementation

**Phase Ω-4** · Package: `src/lib/jag/runtime/intent`  
**Authority:** [03_INTENT_RUNTIME.md](../03_INTENT_RUNTIME.md) · Pipeline: [07_RUNTIME_PIPELINE.md](../07_RUNTIME_PIPELINE.md)

---

## Constitutional gate

| Question | Answer |
|----------|--------|
| Domain knowledge? | **No** |
| Duplicate workflow / business logic? | **No** — normalized objective only |
| Bypass Runtime? | **No** — Intent stage after Context |
| Requires LLM? | **No** — signal registration only |
| Education-specific? | **No** |

---

## Architecture

```text
Identity + ContextSnapshot
    + host IntentSignals (command, navigation, events, …)
    + IntentProvider.detect()
        ↓
IntentResolver (merge · filter · conflict · confidence)
        ↓
RuntimeIntent
        ↓ history ring buffer
Cognition → …
```

Intent is **not** natural language, a route, a UI click, or a workflow.  
It is a normalized `RuntimeIntent` for downstream stages.

---

## Public APIs

```ts
import {
  createIntentRuntime,
  installIntentRuntime,
  INTENT_EVENT_TYPES,
  UNKNOWN_INTENT_ID,
  type IntentProvider,
  type IntentSignal,
} from "@/lib/jag/runtime";

installIdentityRuntime(jag);
installContextRuntime(jag);
installIntentRuntime(jag);

await jag.run({
  composeOnly: true,
  stopAfter: "intent",
  initialData: {
    sessionRef: "…",
    contextId: "ops.home",
    explicitIntentId: "review.inbox",
    // or intentSignals: IntentSignal[]
  },
});
```

| Method | Purpose |
|--------|---------|
| `detect` | Collect candidates from signals + providers |
| `resolve` / `resolveOrThrow` | Pick winner → `RuntimeIntent` |
| `clarify` | Lock user choice as explicit |
| `replace` | Replace active intent |
| `history` | Short ring buffer |
| `listConcurrent` | Secondary intents |
| `purgeExpired` | Drop expired intents / history |

---

## Confidence & conflicts

| Band | Range | Behavior |
|------|-------|----------|
| High | ≥ 0.85 | Proceed |
| Medium | 0.55–0.84 | Alternatives OK |
| Low | < 0.55 | `requiresClarification` |
| Explicit | 1.0 | Always preferred |

Precedence: explicit → temporary context task → safety → preference → context default → provider → inferred → unknown.

---

## Extension model

```ts
runtime.registry.registerIntentProvider({
  id: "pack.signals",
  catalog: [{ intentId: "review.inbox", actionCandidates: ["…"] }],
  detect(request, signals) {
    return [/* IntentCandidate */];
  },
});
```

Future AI adapters register as providers only — **no LLM inside Core**.

---

## Events

| Event | When |
|-------|------|
| `jag.runtime.intent.resolved` | Resolve complete |
| `jag.runtime.intent.changed` | Active intent id changed |
| `jag.runtime.intent.expired` | TTL / purge |
| `jag.runtime.intent.conflict_detected` | Rival candidates |
| `jag.runtime.intent.confidence_changed` | Same id, new score |
| `jag.runtime.intent.resolution_failed` | Hard failure |

---

## Tests

`tests/unit/jag/runtime/intent.test.ts`

---

## Out of scope

LLM · OpenAI · prompts · NLP · business logic · Education · UI · workflows
