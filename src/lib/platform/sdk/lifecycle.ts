import type {
  ApplicationLifecycleEvent,
  ApplicationLifecycleState,
  SdkValidationIssue,
} from "@/lib/platform/sdk/types";

/**
 * Allowed lifecycle transitions (orchestration contracts only).
 *
 * install → validated → enabled ⇄ disabled → uninstalled
 * upgrade may run from enabled or disabled → upgrading → enabled/disabled
 */
const TRANSITIONS: Record<
  ApplicationLifecycleEvent,
  Partial<Record<ApplicationLifecycleState, ApplicationLifecycleState>>
> = {
  install: {
    uninstalled: "installed",
  },
  validate: {
    installed: "validated",
    validated: "validated",
    disabled: "validated",
    enabled: "validated",
  },
  enable: {
    validated: "enabled",
    disabled: "enabled",
    upgrading: "enabled",
  },
  disable: {
    enabled: "disabled",
    validated: "disabled",
    upgrading: "disabled",
  },
  upgrade: {
    enabled: "upgrading",
    disabled: "upgrading",
    validated: "upgrading",
  },
  uninstall: {
    installed: "uninstalled",
    validated: "uninstalled",
    enabled: "uninstalled",
    disabled: "uninstalled",
    upgrading: "uninstalled",
  },
};

export function canTransition(
  from: ApplicationLifecycleState,
  event: ApplicationLifecycleEvent
): boolean {
  return TRANSITIONS[event][from] !== undefined;
}

export function nextLifecycleState(
  from: ApplicationLifecycleState,
  event: ApplicationLifecycleEvent
): ApplicationLifecycleState | null {
  return TRANSITIONS[event][from] ?? null;
}

export function assertTransition(
  from: ApplicationLifecycleState,
  event: ApplicationLifecycleEvent
): ApplicationLifecycleState {
  const next = nextLifecycleState(from, event);
  if (!next) {
    throw new Error(
      `Invalid lifecycle transition: cannot ${event} from state "${from}"`
    );
  }
  return next;
}

export function lifecycleTransitionIssue(
  from: ApplicationLifecycleState,
  event: ApplicationLifecycleEvent
): SdkValidationIssue | null {
  if (canTransition(from, event)) return null;
  return {
    path: "lifecycle",
    code: "invalid_lifecycle_transition",
    message: `Cannot ${event} from state "${from}"`,
  };
}

export function isOperational(state: ApplicationLifecycleState): boolean {
  return state === "enabled";
}

export function listLifecycleEvents(): ApplicationLifecycleEvent[] {
  return ["install", "validate", "enable", "disable", "upgrade", "uninstall"];
}
