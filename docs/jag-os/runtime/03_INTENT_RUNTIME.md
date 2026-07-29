# 03 — Intent Runtime

**Subsystem 3 of 6** · JAG Core

---

## Purpose

Determine **what the user is trying to accomplish**—explicitly or inferred—so Cognition and Experience can prioritize without guessing in the UI layer.

---

## Responsibilities

1. Detect intent from signals (command, navigation, search, open tasks, calendar, focus entity).  
2. Resolve to a canonical intent catalog entry (or `unknown`).  
3. Score confidence; separate explicit vs inferred.  
4. Resolve conflicts when multiple intents compete.  
5. Maintain short intent history for continuity.  
6. Escalate low-confidence intents to clarification (Experience) or safe defaults.  
7. Never invent domain workflows—map to Action candidates later.

---

## Intent detection

| Signal class | Examples |
|--------------|----------|
| Explicit | Command palette submit, CTA click, form submit, API action id |
| Navigational | Route / context switch / search query |
| Situational | Overdue tasks, open approvals, calendar “now” |
| Conversational | Coach / Mr. JAG utterance (when present) |
| Focus-derived | Focus entity type (invoice, student, class) |

---

## Intent resolution

```text
IntentSnapshot {
  intentId               // catalog key or unknown
  label
  domainHints[]
  actionCandidates[]     // opaque ids; Action Runtime resolves
  confidence: 0..1
  source: explicit | inferred | hybrid
  signals[]              // evidence of detection
  conflicts[]            // rejected competing intents
  requiresClarification: boolean
  historyRef?            // prior intent id
  resolvedAt
}
```

---

## Intent confidence

| Band | Range | Runtime behavior |
|------|-------|------------------|
| High | ≥ 0.85 | Proceed to Cognition with intent locked |
| Medium | 0.55–0.84 | Cognition + Experience show primary + alternatives |
| Low | < 0.55 | Clarification UI or generic briefing; no speculative Actions |
| Explicit | n/a | Confidence = 1.0 for stated command/action |

---

## Explicit vs inferred

- **Explicit** always wins over inferred of different intentId.  
- Inferred may refine parameters of an explicit intent (e.g. which student).  
- Inferred must cite `signals[]`; no silent intent.

---

## Conflict resolution

Order of precedence:

1. Explicit user command / CTA  
2. Active temporary context task  
3. Time-critical approvals / safety intents  
4. Persistent user preference defaults  
5. Context-family default briefing intent  
6. `unknown`

Ties → `requiresClarification = true`.

---

## Intent history

- Keep a short ring buffer (e.g. last N intents per session).  
- Used for continuity (“continue grading”) and undo of intent switches.  
- Not a substitute for Organizational Memory.

---

## Escalation rules

| Condition | Escalation |
|-----------|------------|
| Low confidence | Experience clarification chips |
| Safety / compliance intent | Prefer explicit confirmation before Action |
| Cross-domain ambiguity | Offer domain-scoped alternatives |
| Permission missing for top intent | Downgrade to view-only / alternate intent |

---

## Inputs / Outputs / Dependencies

| Inputs | Outputs | Depends on |
|--------|---------|------------|
| IdentitySnapshot | IntentSnapshot | Identity, Context |
| ContextSnapshot | ClarificationRequest? | Intent catalog |
| UserEvent | | Command / Search Core |
| Preferences | | |

**Used by:** Cognition, Experience, Action

---

## Events

`intent.detected`, `intent.resolved`, `intent.clarification_requested`, `intent.conflict_resolved`, `intent.history_appended`.

---

## Interfaces (contract)

```text
IntentRuntime {
  detect(identity, context, event): IntentCandidate[]
  resolve(identity, context, candidates | explicit): IntentSnapshot
  clarify(identity, context, choice): IntentSnapshot
  history(identity, limit): IntentSnapshot[]
}
```

---

## Extension points

- Domain packs register intent catalog entries + signal extractors.  
- Custom conflict policies via pack config.  
- Coach NLU adapters plug in as signal providers only.

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Empty catalog | `unknown` + generic Experience |
| Detector error | Fall back to explicit-only; log |
| Ambiguous forever | Stay in clarification; no auto-Action |

---

## Security considerations

- Intent must not escalate permissions.  
- Do not expose intent labels for unauthorized domains.  
- Audit explicit intents that lead to privileged Actions.
