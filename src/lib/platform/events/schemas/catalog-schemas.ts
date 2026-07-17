import type { EventCategory, EventDefinition } from "@/lib/platform/events/types";

/** Platform-generic category reference events for registry discovery. */
export const CATEGORY_REFERENCE_EVENT_DEFINITIONS: EventDefinition[] = (
  [
    ["identity", "identity.user.updated", "User Updated"],
    ["organization", "organization.lifecycle.changed", "Organization Lifecycle Changed"],
    ["security", "security.access.denied", "Security Access Denied"],
    ["audit", "audit.record.written", "Audit Record Written"],
    ["workflow", "workflow.instance.completed", "Workflow Instance Completed"],
    ["billing", "billing.subscription.changed", "Billing Subscription Changed"],
    ["knowledge_graph", "knowledge_graph.node.upserted", "Knowledge Graph Node Upserted"],
    ["executive_graph", "executive_graph.signal.emitted", "Executive Graph Signal Emitted"],
    ["ai", "ai.agent.completed", "AI Agent Completed"],
    ["marketplace", "marketplace.module.installed", "Marketplace Module Installed"],
    ["connector", "connector.sync.completed", "Connector Sync Completed"],
    ["application", "application.domain.event", "Application Domain Event"],
  ] as const
).map(([category, eventType, name], index) => ({
  eventType,
  name,
  description: `Platform ${category} event`,
  domain: category,
  category: category as EventCategory,
  version: 1,
  status: "active" as const,
  dispatchMode: "both" as const,
  scopes: ["internal" as const],
  entityTypes: ["*"],
  sortOrder: 1000 + index,
  documentation: `Canonical ${category} category event for discovery and tests.`,
}));
