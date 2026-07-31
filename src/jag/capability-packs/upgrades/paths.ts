/**
 * Upgrade paths — declarative metadata for pack upgrades.
 */

import type { CapabilityPack } from "@/jag/blueprints/contracts";
import { compareSemver } from "@/jag/capability-packs/versioning";

export function listUpgradePaths(pack: CapabilityPack) {
  return Object.freeze([...(pack.upgrades ?? [])]);
}

export function findUpgradePath(
  pack: CapabilityPack,
  fromVersion: string,
  toVersion: string
) {
  return (
    pack.upgrades?.find(
      (u) => u.fromVersion === fromVersion && u.toVersion === toVersion
    ) ?? null
  );
}

/** Whether toVersion is a known upgrade from fromVersion (direct path). */
export function isDeclaredUpgrade(
  pack: CapabilityPack,
  fromVersion: string,
  toVersion: string
): boolean {
  return findUpgradePath(pack, fromVersion, toVersion) != null;
}

export function isNewerPackVersion(a: string, b: string): boolean {
  return compareSemver(a, b) > 0;
}
