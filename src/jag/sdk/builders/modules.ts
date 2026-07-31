/**
 * Blueprint Builder — module / composition helpers.
 */

import {
  BLUEPRINT_FOUNDATION_CAPABILITY_MAP,
  BLUEPRINT_FOUNDATION_MODULES,
  type IndustryBlueprintComposition,
} from "@/jag/blueprint-framework";

/** The nine foundation modules every industry must include. */
export function listFoundationModules(): readonly string[] {
  return BLUEPRINT_FOUNDATION_MODULES;
}

/**
 * Build industry composition (module → capability keys).
 * Never includes pack ids.
 */
export function buildFoundationComposition(input: {
  readonly version: string;
  readonly verticalModules?: readonly string[];
}): IndustryBlueprintComposition {
  return Object.freeze({
    version: input.version,
    foundationModules: BLUEPRINT_FOUNDATION_MODULES,
    verticalModules: Object.freeze([...(input.verticalModules ?? [])]),
    foundationCapabilities: BLUEPRINT_FOUNDATION_CAPABILITY_MAP,
  });
}

/** Merge foundation + vertical module lists (deduped, foundation first). */
export function buildModuleList(
  verticalModules: readonly string[] = []
): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const mod of [...BLUEPRINT_FOUNDATION_MODULES, ...verticalModules]) {
    if (seen.has(mod)) continue;
    seen.add(mod);
    out.push(mod);
  }
  return Object.freeze(out);
}
