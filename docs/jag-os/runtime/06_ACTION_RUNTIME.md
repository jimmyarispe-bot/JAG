# 06 — Action Runtime

**Subsystem 6 of 6** · JAG Core (dispatch)

---

## Purpose

Execute **user-authorized actions** against Domain packages and Core engines—workflows, approvals, delegation, undo, audit, evidence, Memory, Twin—after Identity → Context → Intent → Cognition → Experience.

---

## Responsibilities

1. Action execution (idempotent where required).  
2. Workflow dispatch into Core Workflow engine.  
3. Approvals (request, grant, deny) via Workflow / Decision contracts.  
4. Delegation of action authority (with Identity Runtime).  
5. Undo / compensating actions when supported.  
6. Audit logging (platform audit).  
7. Evidence logging (Evidence Ledger contract).  
8. Memory updates (Organizational Memory).  
9. Twin publication (domain adapters → single Twin runtime).  
10. Never embed domain SoR business rules—call packages.

---

## Action execution

```text
ActionRequest {
  actionId
  identityRef
  contextRef
  intentRef?
  cognitionRecommendationId?
  payload
  idempotencyKey?
  confirmationToken?     // for destructive / high-risk
}

ActionResult {
  status: succeeded | failed | pending_approval | rejected | undone
  domainPackageId?
  workflowInstanceId?
  evidenceRefs[]
  auditEventId
  undoToken?
  twinPublicationIds[]
  error?
}
```

Pipeline before mutate:

1. Re-resolve Identity (fresh permissions).  
2. Validate Context still authorized.  
3. Authorize permission for `actionId`.  
4. Optional: require confirmation / step-up MFA.  
5. Dispatch to handler (domain or Core).  
6. On success: audit + evidence + Memory + Twin hooks.  
7. Return ActionResult to Experience.

---

## Workflow dispatch

- Long-running / multi-step → Workflow engine.  
- Action Runtime returns `pending_approval` or `workflowInstanceId`.  
- Domain packs register workflow templates; Runtime does not invent BPMN.

---

## Approvals

| Step | Owner |
|------|-------|
| Request approval | Action Runtime → Workflow / Decision queue |
| Decide | Authorized approver via Identity |
| Resume | Action Runtime continues or compensates |

Approvals are **not** a second Decision Engine inside Experience.

---

## Delegation

- Action may create a time-bounded delegation grant (Identity Runtime).  
- Delegated Actions carry `delegation` on IdentitySnapshot.  
- Full audit of actor vs effective user.

---

## Undo

| Support level | Behavior |
|---------------|----------|
| Native undo | Domain/Core provides compensating action; `undoToken` |
| Soft undo | Archive / cancel preferred over hard delete |
| No undo | Declare in action catalog; require strong confirmation |

CRUD gate: prefer Archive / Cancel / Deactivate over hard delete.

---

## Audit

Every Action writes platform audit with: actor, effective user, org/school, actionId, payload summary, result, correlation ids (intent, cognition, evidence).

---

## Evidence logging

Mutating Actions publish EvidenceRefs for:

- Decision outcomes  
- State changes material to Twin/Memory  
- Recommendations that were accepted/rejected

---

## Memory updates

On meaningful outcomes: write Organizational Memory entries (decision, preference, outcome) via Memory API—not ad-hoc stores.

---

## Twin publication

Domain adapters publish Twin updates through the **single Twin runtime**. Action Runtime triggers publication; it does not maintain a second Twin.

---

## Inputs / Outputs / Dependencies

| Inputs | Outputs |
|--------|---------|
| ActionRequest | ActionResult |
| Identity / Context (fresh) | Side effects via packages |

Depends on: Domain packages, Workflow, Decision queue, Audit, Evidence, Memory, Twin, Permission engine.

**Used by:** Experience CTAs, Command Core, API gateways (future)

---

## Events

`action.requested`, `action.authorized|denied`, `action.dispatched`, `action.completed|failed`, `action.approval_pending`, `action.undone`, `action.evidence_written`, `action.memory_updated`, `action.twin_published`.

---

## Interfaces (contract)

```text
ActionRuntime {
  execute(request): ActionResult
  approve(approvalId, decision): ActionResult
  undo(undoToken): ActionResult
  describe(actionId): ActionCatalogEntry
}
```

---

## Extension points

- Domain packs register `ActionHandler` + catalog entries.  
- Workflow templates registration.  
- Compensating action binders.  
- Twin publication hooks per entity type.

---

## Failure handling

| Failure | Behavior |
|---------|----------|
| Authz fail | `rejected`; audit; no side effects |
| Domain error | `failed`; compensate if partial; evidence of failure |
| Workflow timeout | `pending_approval` / pending state; pollable |
| Twin publish fail | Action may succeed; emit retryable Twin event; do not hide |

---

## Security considerations

- Server-side authorize on every execute.  
- Idempotency keys for payment-like actions.  
- Confirmation + type-DELETE for hard delete (CRUD standard).  
- Strip unauthorized payload fields before domain call.
