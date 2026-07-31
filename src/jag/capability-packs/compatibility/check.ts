/**
 * Compatibility checks — industry, modules, JAG runtime range.
 */

import type { CapabilityPack, IndustryId } from "@/jag/blueprints/contracts";
import { compareSemver } from "@/jag/capability-packs/versioning";

export function isPackCompatibleWithIndustry(
  pack: CapabilityPack,
  industryId: IndustryId
): boolean {
  const ids = pack.compatibility?.industryIds;
  if (!ids?.length) return true;
  return ids.includes(industryId);
}

export function isPackCompatibleWithRuntime(
  pack: CapabilityPack,
  jagRuntimeVersion?: string
): boolean {
  if (!jagRuntimeVersion) return true;
  const min = pack.compatibility?.jagRuntimeMin;
  const max = pack.compatibility?.jagRuntimeMax;
  if (min && compareSemver(jagRuntimeVersion, min) < 0) return false;
  if (max && compareSemver(jagRuntimeVersion, max) > 0) return false;
  return true;
}

export function isPackCompatibleWithModules(
  pack: CapabilityPack,
  enabledModules: readonly string[]
): boolean {
  const required = pack.compatibility?.requiresModules ?? [];
  if (!required.length) return true;
  const enabled = new Set(enabledModules);
  return required.every((m) => enabled.has(m));
}
