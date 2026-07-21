# Workflow & Automation Engine

AcademyOS RC4 — platform-wide, event-driven workflows with configurable triggers, conditions, actions, execution history, and retry.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `supabase/migrations/191_workflow_automation_engine.sql` |
| Product module | `src/lib/workflows/` |
| Event bridge | `src/lib/workflows/bridge.ts` (from `recordActivity`) |
| Extension contract | `src/lib/workflows/extension.ts` |
| Dashboard | `/dashboard/workflows`, `/history`, `/new`, `/[id]` |
| Existing engines (reuse, not replaced) | `src/lib/platform/automation` (B-08), `src/lib/platform/workflow` (B-04) |

```
Activity / Domain Event
        │
        ▼
 recordActivity() ──► onActivityEventForWorkflows()
        │                        │
        ▼                        ▼
 platform_activity_events   Match trigger_key
                                     │
                                     ▼
                          Evaluate conditions
                                     │
                                     ▼
                          Walk JSON graph (nodes/edges)
                                     │
                                     ▼
                          Execute actions + log steps
                                     │
                                     ▼
                          Retry / dead_letter + EI events
```

## Data model

### `platform_workflows`
Name, description, category, trigger_key, **definition (JSON)**, enabled, version, status, **audit_id**, run stats, retry policy.

### `platform_workflow_executions`
Per-run history: trigger, started/finished, duration, status (`pending|running|completed|failed|skipped|retrying|dead_letter`), attempt, error, context, **dedupe_key**.

### `platform_workflow_execution_steps`
Per-node step log for audit/debugging.

## JSON schema (definition)

```json
{
  "version": "1.0",
  "entryNodeId": "node-trigger",
  "nodes": [
    { "id": "node-trigger", "type": "trigger", "label": "Trigger", "config": { "triggerKey": "..." } },
    { "id": "node-action-0", "type": "action", "label": "Send email", "config": { "actionType": "send_email", "subject": "..." } },
    { "id": "node-end", "type": "end", "label": "End", "config": {} }
  ],
  "edges": [
    { "id": "e1", "from": "node-trigger", "to": "node-action-0", "branch": "default" },
    { "id": "e2", "from": "node-action-0", "to": "node-end", "branch": "default" }
  ],
  "conditionGroups": [
    {
      "id": "g1",
      "op": "AND",
      "rules": [
        { "id": "r1", "field": "student_status", "operator": "equals", "value": "active" }
      ]
    }
  ]
}
```

Node types: `trigger | condition | action | delay | branch | end`.

## Trigger lifecycle

1. Domain code calls `recordActivity({ eventType })`.
2. Bridge maps event → `trigger_key` via `WORKFLOW_TRIGGER_LIBRARY`.
3. Enabled workflows with matching trigger are loaded (school-scoped or global).
4. Top-level `conditionGroups` evaluated; if fail → execution `skipped`.
5. Graph walk from `entryNodeId`; actions execute; steps logged.
6. Stats updated; EI events published.

System triggers: `system.scheduled_time`, `system.manual`, `system.api`.

## Action lifecycle

Actions are executed by `executeWorkflowAction`:

| Action | Behavior |
|--------|----------|
| send_email / send_sms | Inserts `platform_communications` (SMS deferred to provider) |
| portal_notification | `platform_in_app_notifications` |
| create_task | Mission Control item (best-effort) |
| update_student / update_family | Patch rows |
| add_timeline_event / publish_executive_event | `recordActivity` |
| wait / branch | Graph control |
| call_provider_adapter | Extension registry stub |

## Retry behavior

- `max_retries` + `retry_backoff_ms` on workflow
- Failed run → `retrying` → automatic re-execute with backoff (capped)
- Exhausted → `dead_letter`
- Manual **Re-run** from history (clears dedupe)
- **Duplicate prevention** via unique `(workflow_id, dedupe_key)` for active/completed runs

## Permissions

| Role | Access |
|------|--------|
| Founder / CEO | Full |
| School Leader | Manage school workflows |
| Admissions | Admissions category |
| Finance (permission) | Billing / scholarships |
| Teachers | View applicable workflows |
| Parents / Students | No access |

## Starter templates

- New lead → welcome email  
- Student accepted → enrollment checklist  
- Scholarship expiring → reminder  
- Tuition overdue → notification  
- Student archived → notify administrators  
- New family → onboarding sequence  

Install via dashboard **Install starters** or `/dashboard/workflows/new`.

## Executive Intelligence events

`workflow.created` · `workflow.enabled` · `workflow.disabled` · `workflow.executed` · `workflow.failed` · `workflow.completed`

## Extension guide

Use `src/lib/workflows/extension.ts`:

```ts
registerExtension({
  manifest: { id: "twilio", name: "Twilio", version: "1.0.0", capabilities: ["sms"] },
  isConfigured: () => Boolean(process.env.TWILIO_ACCOUNT_SID),
  async invoke(input) { /* send SMS */ },
});
```

Workflow action `call_provider_adapter` and communications providers should resolve through this contract — not hard-wire vendors into core domain services.

## Acceptance criteria

- [x] Workflows are first-class entities with audit IDs  
- [x] Events automatically trigger matching workflows  
- [x] Conditions and actions are configurable  
- [x] Execution history UI  
- [x] Retry + dead-letter + manual re-run  
- [x] Starter templates  
- [x] EI lifecycle events  
- [x] Extension/plugin contract foundation  
