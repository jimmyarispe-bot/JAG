/**
 * Education Capability Pack — first-class domain object.
 */

import type { EducationCapabilityPackMetadata } from "./EducationCapabilityMetadata";

/**
 * Immutable capability pack instance.
 * Holds metadata only; does not execute contributors or alter the planner.
 */
export interface EducationCapabilityPack {
  readonly metadata: EducationCapabilityPackMetadata;
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly maturity: EducationCapabilityPackMetadata["maturity"];
}

export function createEducationCapabilityPack(
  metadata: EducationCapabilityPackMetadata
): EducationCapabilityPack {
  return {
    metadata,
    id: metadata.id,
    name: metadata.name,
    version: metadata.version,
    maturity: metadata.maturity,
  };
}

export function listPackContributors(
  pack: EducationCapabilityPack
): readonly string[] {
  return pack.metadata.contributors;
}

export function listPackPlannerIntents(
  pack: EducationCapabilityPack
): readonly string[] {
  return pack.metadata.plannerIntents;
}
