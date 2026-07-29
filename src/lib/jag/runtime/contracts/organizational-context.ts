/**
 * Organizational / situational context resolved by the Context pipeline stage.
 * Distinct from {@link RuntimeContext} (execution context).
 */

export interface RuntimeOrganizationalContext {
  contextId: string;
  /** Generic family key (e.g. educator, executive) — not a product brand. */
  contextFamily: string;
  organizationId: string;
  focusEntity?: RuntimeEntityRef;
  domainHints: readonly string[];
  mode: "persistent" | "temporary";
  inheritedFrom?: string;
  legacySurfaceId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface RuntimeEntityRef {
  type: string;
  id: string;
}
