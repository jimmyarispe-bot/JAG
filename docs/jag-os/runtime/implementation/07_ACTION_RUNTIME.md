# 07 — Action Runtime Implementation

**Phase Ω-7** · Package: `src/lib/jag/runtime/action`  
**Authority:** [06_ACTION_RUNTIME.md](../06_ACTION_RUNTIME.md) · Pipeline: [07_RUNTIME_PIPELINE.md](../07_RUNTIME_PIPELINE.md)

---

## Constitutional gate

| Question | Answer |
|----------|--------|
| Domain knowledge? | **No** |
| Bypass Cognitive Runtime? | **No** — `CognitiveResult` required |
| Mutate without evidence? | **No** — evidence refs required |
| Bypass Runtime contracts? | **No** |
| Education-specific actions? | **No** |

---

## Architecture

```text
Experience CTA / Command
    ↓
ActionExecutionRequest
    ├── RuntimeIdentity (required)
    ├── RuntimeOrganizationalContext (required)
    ├── CognitiveResult (required)
    └── evidenceRefs[] (required — Law 7)
    ↓
Authorize (permission only)
    ↓
ActionDispatcher → ActionProvider (registered adapter)
    ↓
RuntimeActionResult + ActionAudit
    ↓
Events → (future) Evidence / Memory / Twin publication stages
```

Action Runtime **dispatches**. Providers own domain mutations.  
Core ships **zero** provider implementations.

---

## Action model

Generic kinds only:

`create` · `update` · `delete` · `approve` · `reject` · `assign` · `notify` · `schedule` · `generate` · `delegate` · `review` · `investigate` · `custom`

Catalog entry:

```text
ActionCatalogEntry {
  actionId, kind, permission,
  requiresEvidence?, requiresCognition?, requiresConfirmation?
}
```

---

## Public APIs

```ts
import {
  createActionRuntime,
  installActionRuntime,
  ACTION_EVENT_TYPES,
  type ActionProvider,
} from "@/lib/jag/runtime";

jag.registry.registerActionContributor(provider);
installActionRuntime(jag);

await jag.run({
  stopAfter: "action",
  initialData: { sessionRef: "…", actionId: "review.item" },
});
```

| Method | Purpose |
|--------|---------|
| `execute` | Validate → authorize → dispatch → audit |
| `describe` | Catalog lookup |
| `registerProvider` / `registerCatalogEntry` | Local registration |
| `listAudit` | In-memory audit trail |

---

## Gates (mandatory)

1. Identity present  
2. Organizational context present  
3. CognitiveResult with `briefId`  
4. ≥1 evidence reference  
5. Permission grant for catalog `permission`  
6. Registered `ActionProvider` for `actionId`  

Failures return `rejected` / `failed` with audit — no silent mutate.

---

## Audit

Every execution records: action id, identity, context, intent, cognition brief id, evidence refs, provider, status, timestamp, correlation ids.

---

## Events

| Event | When |
|-------|------|
| `jag.runtime.action.requested` | Execute started |
| `jag.runtime.action.authorized` | Permission passed |
| `jag.runtime.action.dispatched` | Provider invoked |
| `jag.runtime.action.completed` | Provider returned non-fail |
| `jag.runtime.action.failed` | Provider error / failed status |
| `jag.runtime.action.rejected` | Gate / authz / missing provider |

---

## Extension model

```ts
runtime.registry.registerActionContributor({
  id: "adapter.example",
  actionIds: ["review.item"],
  catalog: [{ actionId: "review.item", kind: "review", permission: "action.review.item" }],
  execute(request) { return { status: "succeeded", evidenceRefs: request.evidenceRefs }; },
});
```

Legacy `registerActionProvider` remains for kernel fallback when Action Runtime is not installed.

---

## Pipeline

```text
Identity → Context → Intent → Cognition → Experience → Action
  → Registered Domain Provider → Evidence → Memory → Twin
```

Publication stages after Action remain skeleton hooks; Action Runtime emits events for them.

---

## Tests

`tests/unit/jag/runtime/action.test.ts`

---

## Out of scope

Workflows · Education adapters · DB mutations in Core · UI · business rules · shipped provider implementations
