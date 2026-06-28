import type { EventDefinition } from "@/lib/platform/events/types";

/**
 * Reference event definitions demonstrating the platform event catalog model.
 * Domain modules register their own event types — these are domain-agnostic templates.
 */
export const PLATFORM_REFERENCE_EVENT_DEFINITIONS: EventDefinition[] = [
  {
    eventType: "platform.entity.created",
    name: "Entity Created",
    description: "Generic entity lifecycle event for platform integrations",
    domain: "platform",
    version: 1,
    status: "active",
    dispatchMode: "sync",
    scopes: ["internal"],
    entityTypes: ["*"],
    sortOrder: 10,
    tags: ["lifecycle", "platform"],
  },
  {
    eventType: "platform.entity.updated",
    name: "Entity Updated",
    description: "Generic entity update event for cross-module synchronization",
    domain: "platform",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal", "external_webhook"],
    entityTypes: ["*"],
    sortOrder: 20,
    tags: ["lifecycle", "platform"],
  },
  {
    eventType: "platform.workflow.transitioned",
    name: "Workflow Transitioned",
    description: "Workflow state change notification for downstream consumers",
    domain: "platform",
    version: 1,
    status: "active",
    dispatchMode: "async",
    scopes: ["internal"],
    entityTypes: ["workflow_instance"],
    sortOrder: 30,
    tags: ["workflow", "platform"],
  },
  {
    eventType: "platform.decision.executed",
    name: "Decision Executed",
    description: "Decision engine execution completed",
    domain: "platform",
    version: 1,
    status: "active",
    dispatchMode: "both",
    scopes: ["internal"],
    entityTypes: ["decision"],
    sortOrder: 40,
    tags: ["decision", "platform"],
  },
  {
    eventType: "operations.resource.allocated",
    name: "Resource Allocated",
    description: "Operations resource allocation event for async consumers",
    domain: "operations",
    version: 1,
    status: "active",
    dispatchMode: "async",
    scopes: ["internal", "external_webhook"],
    entityTypes: ["resource"],
    sortOrder: 50,
    tags: ["operations", "resources"],
  },
];

/** Canonical event catalog export — alias for registry entries at build time. */
export const PLATFORM_EVENT_CATALOG = PLATFORM_REFERENCE_EVENT_DEFINITIONS;
