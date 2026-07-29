/**
 * Education Capability Pack Registry — discovery and introspection.
 * Does not modify Graph, Planner, Runtime, or contributor implementations.
 */

import {
  createEducationCapabilityPack,
  listPackContributors,
  listPackPlannerIntents,
  type EducationCapabilityPack,
} from "./EducationCapabilityPack";
import { EDUCATION_CAPABILITY_PACK_MANIFESTS } from "./EducationCapabilityManifest";
import type { EducationCapabilityPackMetadata } from "./EducationCapabilityMetadata";
import {
  validateEducationCapabilityPacks,
  type EducationCapabilityValidationResult,
} from "./EducationCapabilityValidator";

export interface EducationCapabilityRegistry {
  /** All registered packs (stable order). */
  listCapabilityPacks(): readonly EducationCapabilityPack[];
  /** Lookup by pack id. */
  getCapabilityPack(id: string): EducationCapabilityPack | undefined;
  /** Contributor ids declared by a pack (by pack or id). */
  listContributors(pack: EducationCapabilityPack | string): readonly string[];
  /** Planner intents declared by a pack (by pack or id). */
  listPlannerIntents(pack: EducationCapabilityPack | string): readonly string[];
  /** Structural validation of the registered set. */
  validate(): EducationCapabilityValidationResult;
  /** Raw metadata manifests. */
  manifests(): readonly EducationCapabilityPackMetadata[];
}

export function createEducationCapabilityRegistry(
  manifests: readonly EducationCapabilityPackMetadata[] = EDUCATION_CAPABILITY_PACK_MANIFESTS
): EducationCapabilityRegistry {
  const packs = manifests.map(createEducationCapabilityPack);
  const byId = new Map(packs.map((p) => [p.id, p] as const));

  function resolve(
    pack: EducationCapabilityPack | string
  ): EducationCapabilityPack | undefined {
    if (typeof pack === "string") return byId.get(pack);
    return pack;
  }

  return {
    listCapabilityPacks() {
      return packs;
    },
    getCapabilityPack(id) {
      return byId.get(id);
    },
    listContributors(pack) {
      const resolved = resolve(pack);
      return resolved ? listPackContributors(resolved) : [];
    },
    listPlannerIntents(pack) {
      const resolved = resolve(pack);
      return resolved ? listPackPlannerIntents(resolved) : [];
    },
    validate() {
      return validateEducationCapabilityPacks(manifests);
    },
    manifests() {
      return manifests;
    },
  };
}

/** Default singleton-style registry for the Education domain. */
let defaultRegistry: EducationCapabilityRegistry | undefined;

export function getDefaultEducationCapabilityRegistry(): EducationCapabilityRegistry {
  if (!defaultRegistry) {
    defaultRegistry = createEducationCapabilityRegistry();
  }
  return defaultRegistry;
}

/** Discovery helpers — thin wrappers over the default registry. */
export function listCapabilityPacks(): readonly EducationCapabilityPack[] {
  return getDefaultEducationCapabilityRegistry().listCapabilityPacks();
}

export function getCapabilityPack(
  id: string
): EducationCapabilityPack | undefined {
  return getDefaultEducationCapabilityRegistry().getCapabilityPack(id);
}

export function listContributors(
  pack: EducationCapabilityPack | string
): readonly string[] {
  return getDefaultEducationCapabilityRegistry().listContributors(pack);
}

export function listPlannerIntents(
  pack: EducationCapabilityPack | string
): readonly string[] {
  return getDefaultEducationCapabilityRegistry().listPlannerIntents(pack);
}

export function validateEducationCapabilityRegistry(): EducationCapabilityValidationResult {
  return getDefaultEducationCapabilityRegistry().validate();
}
