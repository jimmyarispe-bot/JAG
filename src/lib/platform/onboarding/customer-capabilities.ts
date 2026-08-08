/**
 * Customer Executive Intelligence baseline capabilities.
 * Bound to the provisioned organization during Generate Workspace.
 */

/** Always enabled for customer Executive Intelligence workspaces. */
export const CUSTOMER_REQUIRED_CAPABILITY_IDS = [
  "jag.intelligence.conversation",
  "jag.intelligence.watchers",
  "jag.decisions.center",
  "jag.intelligence.briefings",
  "jag.intelligence.strategy",
  "jag.intelligence.memory",
  "jag.intelligence.scenarios",
  "jag.intelligence.explainability",
  "jag.intelligence.listening",
] as const;

/** Shell nav item ids allowed in customer context despite group:"system". */
export const CUSTOMER_SHELL_ALLOWLIST_IDS = ["overview", "settings"] as const;

export function mergeCustomerEnabledCapabilityIds(
  selected: readonly string[]
): readonly string[] {
  const set = new Set<string>([...selected, ...CUSTOMER_REQUIRED_CAPABILITY_IDS]);
  return [...set];
}
