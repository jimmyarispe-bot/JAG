/**
 * Enablement — how packs become active for an organization.
 */

import type { CapabilityPack } from "@/jag/blueprints/contracts";
import type {
  CapabilityPackEnablement,
  CapabilityPackResolutionContext,
  CapabilityPackSelectionResult,
} from "@/jag/capability-packs/contracts";
import {
  isPackCompatibleWithIndustry,
  isPackCompatibleWithModules,
  isPackCompatibleWithRuntime,
} from "@/jag/capability-packs/compatibility";
import { packProvidesModules } from "@/jag/capability-packs/versioning";

function enablementMap(
  enablements: readonly CapabilityPackEnablement[] | undefined
): Map<string, CapabilityPackEnablement> {
  const map = new Map<string, CapabilityPackEnablement>();
  for (const e of enablements ?? []) {
    map.set(e.packId, e);
  }
  return map;
}

/**
 * Select packs for Runtime Generation using Architecture rules:
 * - retired → skip
 * - draft → skip unless explicitly enabled
 * - deprecated → include with warning if otherwise eligible
 * - modules / enablements / compatibility must pass
 * - dependencies assumed pre-validated via validateCapabilityPackSet
 */
export function resolveEnabledCapabilityPacks(
  context: CapabilityPackResolutionContext
): CapabilityPackSelectionResult {
  const enabledModules = new Set(context.enabledModules);
  const enablements = enablementMap(context.enablements);
  const selected: CapabilityPack[] = [];
  const skipped: { packId: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Deduplicate by id (first wins — callers should sort deterministically).
  const byId = new Map<string, CapabilityPack>();
  for (const pack of context.availablePacks) {
    if (!byId.has(pack.id)) byId.set(pack.id, pack);
  }

  const ordered = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

  for (const pack of ordered) {
    const status = pack.status ?? "published";
    const pin = enablements.get(pack.id);

    if (pin && pin.enabled === false) {
      skipped.push({ packId: pack.id, reason: "explicitly_disabled" });
      continue;
    }

    if (status === "retired") {
      skipped.push({ packId: pack.id, reason: "retired" });
      continue;
    }

    if (status === "draft" && pin?.enabled !== true) {
      skipped.push({ packId: pack.id, reason: "draft_not_enabled" });
      continue;
    }

    if (pin?.version && pack.version && pin.version !== pack.version) {
      skipped.push({
        packId: pack.id,
        reason: `version_pin_mismatch:${pin.version}`,
      });
      continue;
    }

    if (!isPackCompatibleWithIndustry(pack, context.industryId)) {
      skipped.push({ packId: pack.id, reason: "industry_incompatible" });
      continue;
    }

    if (!isPackCompatibleWithRuntime(pack, context.jagRuntimeVersion)) {
      skipped.push({ packId: pack.id, reason: "runtime_incompatible" });
      continue;
    }

    if (!isPackCompatibleWithModules(pack, context.enabledModules)) {
      skipped.push({ packId: pack.id, reason: "requires_modules" });
      continue;
    }

    const modules = packProvidesModules(pack);
    const moduleMatch =
      !modules.length || modules.some((m) => enabledModules.has(m));
    const explicitEnable = pin?.enabled === true;

    if (!moduleMatch && !explicitEnable) {
      skipped.push({ packId: pack.id, reason: "modules_not_enabled" });
      continue;
    }

    if (status === "deprecated") {
      warnings.push(
        `Pack "${pack.id}" is deprecated` +
          (pack.deprecated?.successorPackId
            ? `; successor=${pack.deprecated.successorPackId}`
            : "")
      );
    }

    selected.push(pack);
  }

  return {
    selected: Object.freeze(selected),
    skipped: Object.freeze(skipped),
    warnings: Object.freeze(warnings),
  };
}
