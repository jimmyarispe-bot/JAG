# 07 — Runtime Pipeline

**Canonical lifecycle** for every user-facing interaction that reaches domain capability.

---

## 1. Complete lifecycle

```text
User Event
    ↓
Identity
    ↓
Context
    ↓
Intent
    ↓
Cognition
    ↓
Experience
    ↓
Action                    ← only when user (or authorized automation) acts
    ↓
Domain Package            ← and/or Core engine as handler target
    ↓
Evidence
    ↓
Memory
    ↓
Twin
```

Read-only browsing may stop at **Experience** (no Action). Cognition still runs for briefings when configured.

---

## 2. Stage contracts

| Stage | Input | Output | May short-circuit |
|-------|-------|--------|-------------------|
| Identity | UserEvent / session | IdentitySnapshot \| Unauthenticated | Yes → login |
| Context | IdentitySnapshot | ContextSnapshot | Yes → empty/onboarding |
| Intent | Identity + Context + Event | IntentSnapshot | Rarely (unknown OK) |
| Cognition | I + C + Intent | CognitiveBrief | Partial brief OK |
| Experience | I + C + Intent + Brief | WorkspaceModel | Always produces shell |
| Action | ActionRequest | ActionResult | Only on act |
| Domain Package | Handler call | Domain result | Errors bubble |
| Evidence | Action/domain facts | EvidenceRef[] | Best-effort + retry |
| Memory | Outcomes | MemoryEntry | Best-effort + retry |
| Twin | State deltas | TwinPublication | Best-effort + retry |

---

## 3. Detailed stage notes

### User Event

Any of: page load, context switch, command, search, CTA, notification open, Coach message, workflow callback.

### Identity → Context

No Context without Identity. Org switch restarts from Identity scope refresh.

### Context → Intent

Context family supplies default intent priors; Event may override with explicit intent.

### Intent → Cognition

High-confidence intents narrow evidence gather; low-confidence widens briefing / clarification.

### Cognition → Experience

Experience **never** invents recommendations; it only composes CognitiveBrief + chrome.

### Experience → Action

CTA / Command / API produces ActionRequest. Experience does not mutate SoR.

### Action → Domain Package

Handler owns business rules. Runtime owns authz, audit, evidence hooks.

### Domain → Evidence → Memory → Twin

Post-commit publication chain. Order is logical; implementations may parallelize with outbox. Evidence before Memory/Twin when claims depend on provenance.

---

## 4. Correlation

Every pipeline run carries:

```text
correlationId
sessionId
identityIssuedAt
contextId
intentId?
cognitionBriefId?
actionId?
```

Propagated into audit, evidence, Memory, Twin.

---

## 5. Sync vs async

| Path | Mode |
|------|------|
| Identity → Experience (compose) | Prefer sync request path |
| Cognition heavy gather | Sync with budgets; async refresh allowed |
| Action → Workflow | Async |
| Evidence / Memory / Twin | Async outbox acceptable |

---

## 6. Failure propagation

```text
Unauthenticated     → stop; login Experience
Context unavailable → stop; onboarding Experience
Intent unknown      → continue; clarification Experience
Cognition partial   → continue; gaps in Brief
Action denied       → stop mutate; toast + audit
Domain fail         → ActionResult.failed; compensate
Evidence/Memory/Twin fail → do not roll back successful domain commit by default;
                            emit retry; surface freshness warning in next Cognition
```

---

## 7. Mapping to Ω-1

Ω-1 Experience Orchestrator implements the **Experience** stage and thin adapters for Identity/Context/Intent/Cognition/Action **without** claiming full Runtime maturity. Full subsystem depth follows [10_RUNTIME_IMPLEMENTATION_PLAN.md](./10_RUNTIME_IMPLEMENTATION_PLAN.md).

---

## 8. Anti-patterns

- Skipping Identity authorize before Action  
- Experience calling Domain SoR directly  
- Cognition inventing numbers without EvidenceRef  
- Treating `/portal/*` as a parallel pipeline  
- Dual Twin or dual Evidence writers outside contracts
