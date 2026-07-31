import { PLATFORM_CAPABILITIES } from "@/lib/platform/sdk/capabilities";
import type { PlatformCapability } from "@/lib/platform/sdk/types";

/**
 * Known extension points applications may target.
 * Unsupported extensionPoint values fail validation.
 */
export const PLATFORM_EXTENSION_POINTS = [
  "schema.field",
  "schema.extension",
  "entity.capability",
  "form.validator",
  "form.field",
  "workflow.action",
  "workflow.condition",
  "api.middleware",
  "graph.node",
  "graph.edge",
  "automation.action",
  "automation.trigger",
  "forecasting.scenario",
  "notification.channel",
  "decision.policy",
] as const;

export type PlatformExtensionPoint = (typeof PLATFORM_EXTENSION_POINTS)[number];

const EXTENSION_SET = new Set<string>(PLATFORM_EXTENSION_POINTS);

export function isSupportedExtensionPoint(value: string): boolean {
  return EXTENSION_SET.has(value);
}

/** Capability → related extension points (documentation / soft guidance). */
export const CAPABILITY_EXTENSION_POINTS: Record<
  PlatformCapability,
  PlatformExtensionPoint[]
> = {
  schemas: ["schema.field", "schema.extension"],
  entities: ["entity.capability"],
  forms: ["form.validator", "form.field"],
  workflows: ["workflow.action", "workflow.condition"],
  apis: ["api.middleware"],
  graph: ["graph.node", "graph.edge"],
  automation: ["automation.action", "automation.trigger"],
  forecasting: ["forecasting.scenario"],
  notifications: ["notification.channel"],
  decisions: ["decision.policy"],
  permissions: [],
};

export function listExtensionPointsForCapability(
  capability: PlatformCapability
): PlatformExtensionPoint[] {
  return CAPABILITY_EXTENSION_POINTS[capability] ?? [];
}

export function listAllExtensionPoints(): readonly string[] {
  return PLATFORM_EXTENSION_POINTS;
}

export function listAllCapabilities(): readonly PlatformCapability[] {
  return PLATFORM_CAPABILITIES;
}
