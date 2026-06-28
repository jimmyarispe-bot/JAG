/** Platform Automation Engine — B-08 Phase 1 foundation */
import "@/lib/platform/automation/registry/register";

export * from "@/lib/platform/automation/engine-types";
export * from "@/lib/platform/automation/version";
export * from "@/lib/platform/automation/catalog/reference-definitions";
export * from "@/lib/platform/automation/catalog/triggers";
export * from "@/lib/platform/automation/catalog/actions";
export * from "@/lib/platform/automation/catalog/conditions";
export * from "@/lib/platform/automation/registry/registry";
export * from "@/lib/platform/automation/registry/validate";
export * from "@/lib/platform/automation/execution/context";
export * from "@/lib/platform/automation/execution/dispatch";
export * from "@/lib/platform/automation/execution/pipeline";
export * from "@/lib/platform/automation/execution/retry";
export * from "@/lib/platform/automation/execution/failure";
export * from "@/lib/platform/automation/execution/audit";
export * from "@/lib/platform/automation/execution/conditions";
export * from "@/lib/platform/automation/execution/execute";
export * from "@/lib/platform/automation/triggers/event-bridge";
export * from "@/lib/platform/automation/triggers/workflow-bridge";

// Preserve legacy automation infrastructure exports
export * from "@/lib/platform/automation/types";
export * from "@/lib/platform/automation/action-registry";
export * from "@/lib/platform/automation/audit";
export * from "@/lib/platform/automation/queue";
export * from "@/lib/platform/automation/timeline";
export * from "@/lib/platform/automation/mission-control";
