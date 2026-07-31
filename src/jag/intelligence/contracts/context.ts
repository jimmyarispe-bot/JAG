/**
 * Context — organizational scope for answering an executive question.
 * Consumes blueprint / pack / definition identifiers — not engine internals.
 */

export type IntelligenceContext = {
  readonly organizationId: string;
  readonly industryId?: string;
  readonly organizationBlueprintId?: string;
  readonly enabledCapabilityPackIds?: readonly string[];
  readonly enabledModules?: readonly string[];
  /** Reporting / analytics definition ids in scope. */
  readonly reportDefinitionIds?: readonly string[];
  readonly analyticsDefinitionIds?: readonly string[];
  readonly policyIds?: readonly string[];
  readonly locale?: string;
  readonly asOf?: string;
  readonly notes?: string;
};

export function isIntelligenceContext(
  value: unknown
): value is IntelligenceContext {
  if (!value || typeof value !== "object") return false;
  const v = value as IntelligenceContext;
  return typeof v.organizationId === "string" && v.organizationId.length > 0;
}
