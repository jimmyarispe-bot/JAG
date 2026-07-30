/**
 * CapabilityPermissions — Sprint 207.
 */

export type CapabilityPermission = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
};

export type CapabilityPermissions = {
  readonly required: readonly CapabilityPermission[];
  readonly optional: readonly CapabilityPermission[];
};

export const CAPABILITY_PERMISSION_PRESETS = {
  executiveRead: {
    id: "jag.executive.read",
    label: "Executive Read",
    description: "View executive intelligence surfaces.",
  },
  executiveAct: {
    id: "jag.executive.act",
    label: "Executive Act",
    description: "Acknowledge alerts and record outcomes.",
  },
} as const;
