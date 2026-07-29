# 04 — Cognitive Runtime

**Subsystem 4 of 6** · JAG Core

---

## Purpose

Produce **evidence-backed understanding and recommendations** for the current Identity × Context × Intent—without duplicating domain business logic.

This is the Runtime’s “think” stage. Law 7 applies: cite evidence or say **I don’t know**.

---

## Responsibilities

1. Gather evidence relevant to Identity, Context, Intent.  
2. Consult Core engines and Domain packages (read / recommend APIs only).  
3. Merge recommendations into a ranked CognitiveBrief.  
4. Detect conflicts between engines/domains.  
5. Generate human-readable reasoning traces.  
6. Preserve evidence traceability end-to-end.  
7. **Never** reimplement ledger, mastery, HR, admissions SoR, or Twin internals.

---

## Gather evidence

Evidence sources (canonical contracts; implementations may lag):

| Source | Role |
|--------|------|
| Evidence Ledger | Provenance of claims and decisions |
| Organizational Memory | Prior decisions, preferences, outcomes |
| Digital Twin | Current organizational state projections |
| Knowledge Engine | Structured org knowledge |
| Domain package queries | SoR facts (students, invoices, …) |
| Core engines | Finance, Risk, Forecast, Workflow state, … |

Gathering is **scoped** by Identity permissions and Context focus.

---

## Consult engines

```text
CognitiveRuntime calls:
  engine.recommend | engine.query | twin.read | memory.recall | domain.readModel
Never:
  engine.reimplementInsideRuntime
```

Engines return structured `Recommendation[]` + `EvidenceRef[]` + optional `confidence`.

---

## Merge recommendations

Merge rules:

1. Drop recommendations failing permission/scope checks.  
2. Drop or mark `unsupported` if missing EvidenceRef (Law 7).  
3. Deduplicate by `(actionId | topicId)`.  
4. Prefer higher-confidence + fresher evidence.  
5. Domain-specific items remain tagged with `domainPackageId`.

---

## Rank priorities

Default ranking signals (configurable, not hardcoded product portals):

- Safety / compliance severity  
- Time criticality (due, SLA)  
- Intent alignment score  
- Evidence strength  
- User preference / Memory boosts  
- Organizational priority from Twin/Strategy (when present)

Output: ordered `priorities[]` + `unknownGaps[]`.

---

## Detect conflicts

| Conflict type | Example | Handling |
|---------------|---------|----------|
| Engine disagreement | Forecast vs Finance cash | Surface both + evidence |
| Domain vs Core | Tuition adapter vs ledger | Prefer ledger for money facts |
| Stale Twin | Twin lag vs live SoR | Prefer SoR + flag Twin freshness |
| Permission vs recommend | Action not allowed | Downgrade to informational |

---

## Generate reasoning

```text
CognitiveBrief {
  summary                  // plain language
  priorities[]             // ranked items
  recommendations[] {
    id, title, rationale,
    evidenceRefs[],
    confidence,
    actionCandidateId?,
    domainPackageId?,
    conflictFlags[]
  }
  unknownGaps[]            // honest “I don’t know”
  reasoningTrace[]         // ordered steps for audit/UI
  consultedSources[]
  generatedAt
}
```

---

## Evidence traceability

Every recommendation MUST include ≥1 `EvidenceRef` **or** be classified under `unknownGaps` / informational-only without Action enablement.

`EvidenceRef { source, id, retrievedAt, hash? }`

---

## No business logic duplication

Cognitive Runtime **orchestrates**. Domain packages and Core engines own calculations. If a calculation is missing, return `unknown`—do not invent a shadow engine.

---

## Inputs / Outputs / Dependencies

| Inputs | Outputs |
|--------|---------|
| IdentitySnapshot | CognitiveBrief |
| ContextSnapshot | ConflictReport? |
| IntentSnapshot | |

Depends on: Evidence, Memory, Twin, Knowledge, Finance/CFO, Workflow, Domain packages, Risk/Forecast as available.

**Used by:** Experience, Action (for gated execution)

---

## Events

`cognition.started`, `cognition.evidence_gathered`, `cognition.engines_consulted`, `cognition.conflict_detected`, `cognition.brief_ready`, `cognition.unknown_declared`.

---

## Interfaces (contract)

```text
CognitiveRuntime {
  think(identity, context, intent, options?): CognitiveBrief
  explain(recommendationId): ReasoningTrace
  refresh(identity, context, intent): CognitiveBrief
}
```

---

## Extension points

- Domain packs register `CognitiveContributor` (recommend/query adapters).  
- Core engines register the same contributor interface.  
- Ranking policy plugins (org-configurable).  
- Evidence source adapters (must meet Ledger contract).

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Source timeout | Partial brief + `unknownGaps` for missing source |
| Engine error | Isolate; continue others; flag conflict/gap |
| Zero evidence | Briefing with unknowns only; no Action push |

---

## Security considerations

- Filter all evidence by Identity scope before merge.  
- Reasoning traces must not leak unauthorized fields.  
- Cognitive output is not an authorization bypass for Action.
