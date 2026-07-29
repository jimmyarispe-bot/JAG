# 08 — Runtime Events

**Event catalog** for the JAG Runtime. Events are contracts for orchestration, audit, and EI/Workflow triggers—not UI framework events.

---

## 1. Conventions

```text
Channel:     jag.runtime.<subsystem>.<name>
Envelope: {
  eventId, eventType, occurredAt,
  correlationId, sessionId,
  organizationId?, schoolId?,
  actorUserId?, effectiveUserId?,
  payload, schemaVersion
}
```

- Past-tense names for facts (`completed`), present for requests if needed.  
- Subsystems publish; others subscribe.  
- Domain packages may emit domain events; Runtime maps them into evidence/Memory/Twin hooks.

---

## 2. Identity events

| Event | Payload (core) |
|-------|----------------|
| `identity.session_started` | principalId, effectiveUserId, orgId |
| `identity.session_ended` | reason |
| `identity.impersonation_started` | actorUserId, targetUserId, reason |
| `identity.impersonation_ended` | sessionId |
| `identity.org_switched` | fromOrgId, toOrgId |
| `identity.school_scope_changed` | schoolIds[] |
| `identity.delegation_granted` | from, to, scope, expiresAt |
| `identity.delegation_expired` | delegationId |
| `identity.authorization_denied` | permission, resourceRef? |

---

## 3. Context events

| Event | Payload (core) |
|-------|----------------|
| `context.discovered` | availableContextIds[] |
| `context.activated` | contextId, mode |
| `context.switched` | from, to |
| `context.temporary_set` | overlay |
| `context.temporary_cleared` | contextId |
| `context.focus_changed` | entityRef |
| `context.focus_cleared` | reason |
| `context.legacy_surface_mapped` | route, contextId |

---

## 4. Intent events

| Event | Payload (core) |
|-------|----------------|
| `intent.detected` | candidates[] |
| `intent.resolved` | intentId, confidence, source |
| `intent.clarification_requested` | options[] |
| `intent.conflict_resolved` | winner, losers[] |
| `intent.history_appended` | intentId |

---

## 5. Cognition events

| Event | Payload (core) |
|-------|----------------|
| `cognition.started` | intentId, contextId |
| `cognition.evidence_gathered` | sourceCounts |
| `cognition.engines_consulted` | engineIds[] |
| `cognition.conflict_detected` | conflictType, refs[] |
| `cognition.brief_ready` | briefId, priorityCount |
| `cognition.unknown_declared` | gaps[] |
| `cognition.refresh_requested` | reason |

---

## 6. Experience events

| Event | Payload (core) |
|-------|----------------|
| `experience.composed` | workspaceId, widgetCount |
| `experience.widget_shown` | widgetId |
| `experience.widget_hidden` | widgetId, reason |
| `experience.briefing_rendered` | briefId |
| `experience.clarification_shown` | intentId |
| `experience.nav_updated` | contextId |
| `experience.command_opened` | — |
| `experience.search_submitted` | queryHash |

---

## 7. Action events

| Event | Payload (core) |
|-------|----------------|
| `action.requested` | actionId, idempotencyKey? |
| `action.authorized` | permission |
| `action.denied` | permission, reason |
| `action.dispatched` | domainPackageId / engineId |
| `action.completed` | resultSummary |
| `action.failed` | errorCode |
| `action.approval_pending` | workflowInstanceId |
| `action.undone` | undoToken |
| `action.evidence_written` | evidenceRefs[] |
| `action.memory_updated` | memoryEntryIds[] |
| `action.twin_published` | twinPublicationIds[] |

---

## 8. Pipeline / meta events

| Event | Payload (core) |
|-------|----------------|
| `runtime.pipeline_started` | correlationId, trigger |
| `runtime.pipeline_completed` | stages[], durationMs |
| `runtime.pipeline_aborted` | stage, reason |
| `runtime.budget_exceeded` | stage, budget |

---

## 9. Subscriber expectations

| Subscriber | Typical interests |
|------------|-------------------|
| Experience Runtime | context.*, intent.*, cognition.brief_ready |
| Action Runtime | experience CTA → action.*; workflow callbacks |
| Audit | identity.*, action.*, authorization_denied |
| EI / Workflow | action.completed, cognition.conflict_detected |
| Twin / Memory | action.*_written / *_published / *_updated |
| Observability | runtime.pipeline_* |

---

## 10. Non-goals

- Not a replacement for domain domain-events catalogs.  
- Not browser DOM events.  
- Not required that every UI micro-interaction emit Runtime events—only pipeline-significant facts.
