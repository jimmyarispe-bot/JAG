import type { EventDefinition } from "@/lib/platform/events/types";
import type { WorkflowDefinition } from "@/lib/platform/workflow/types";
import { OPERATIONAL_LOOP_STAGES } from "@/lib/platform/operational-loop/types";
import { OPERATIONAL_LOOP_WORKFLOW_KEY, LOOP_TRANSITION_REGISTRY } from "@/lib/platform/operational-loop/registry";

export const OPERATIONAL_LOOP_EVENT_DEFINITIONS: EventDefinition[] = [
  {
    eventType: "jag.operational_loop.transitioned",
    name: "Operational Loop Transitioned",
    description: "JAG Operational Loop stage transition completed",
    domain: "platform",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["student"],
    sortOrder: 100,
    tags: ["operational_loop", "jag"],
  },
  {
    eventType: "jag.operational_loop.transition_failed",
    name: "Operational Loop Transition Failed",
    description: "JAG Operational Loop stage transition failed and may require recovery",
    domain: "platform",
    version: 1,
    status: "active",
    dispatchMode: "sync",
    scopes: ["internal"],
    entityTypes: ["student"],
    sortOrder: 101,
    tags: ["operational_loop", "jag", "recovery"],
  },
  {
    eventType: "jag.operational_loop.recovered",
    name: "Operational Loop Transition Recovered",
    description: "Failed operational loop transition side effects were retried successfully",
    domain: "platform",
    version: 1,
    status: "active",
    dispatchMode: "sync",
    scopes: ["internal"],
    entityTypes: ["student"],
    sortOrder: 102,
    tags: ["operational_loop", "jag", "recovery"],
  },
];

export const OPERATIONAL_LOOP_WORKFLOW_DEFINITION: WorkflowDefinition = {
  workflowKey: OPERATIONAL_LOOP_WORKFLOW_KEY,
  name: "JAG Operational Loop",
  description: "Canonical student lifecycle — Admissions through Billing and repeat",
  domain: "sis",
  version: 1,
  status: "active",
  entityType: "student",
  initialStateKey: "admissions",
  sortOrder: 5,
  tags: ["operational_loop", "jag", "student_lifecycle"],
  states: OPERATIONAL_LOOP_STAGES.map((key, idx) => ({
    key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    stateType:
      key === "admissions" ? "initial" : key === "billing" ? "intermediate" : "intermediate",
    sortOrder: (idx + 1) * 10,
  })),
  transitions: Object.values(LOOP_TRANSITION_REGISTRY).map((t, idx) => ({
    key: t.transitionKey,
    label: t.label,
    fromStateKey: t.fromStage,
    toStateKey: t.toStage,
    sortOrder: (idx + 1) * 10,
    triggerKeys: ["loop_transition"],
    actions: [{ key: "notify_next_work", actionType: "create_task", sortOrder: 10 }],
  })),
  triggers: [{ key: "loop_transition", label: "Loop Transition", triggerType: "manual" }],
};
