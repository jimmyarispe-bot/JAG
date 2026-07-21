/**
 * Dependency model over twin organizational graph.
 */

import type { OrganizationModel } from "@/lib/platform/intelligence/digital-twin/types";

export function dependencyChains(model: OrganizationModel): string[] {
  if (model.dependencies.length === 0) return ["No cross-initiative dependencies modeled."];
  return model.dependencies.map((d) => `${d.from} → ${d.to} (${d.kind})`);
}
