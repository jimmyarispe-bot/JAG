/**
 * Create an immutable Runtime Version from a generated Runtime Specification.
 */

import type {
  CreateRuntimeVersionInput,
  RuntimeVersion,
} from "@/jag/runtime-lifecycle/contracts";
import { checksumRuntimeSpecification } from "@/jag/runtime-lifecycle/versioning/checksum";

export const RUNTIME_GENERATOR_VERSION = "1.0.0";

let versionSeq = 0;

export function resetRuntimeVersionSequenceForTests(): void {
  versionSeq = 0;
}

function nextVersionId(
  organizationId: string,
  explicit?: string
): string {
  if (explicit?.trim()) return explicit;
  versionSeq += 1;
  return `${organizationId}.runtime.v${versionSeq}`;
}

/**
 * Freeze a generated Runtime Specification as a Draft runtime version.
 * Specifications are never mutated after this point.
 */
export function createRuntimeVersion(
  input: CreateRuntimeVersionInput
): RuntimeVersion {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const specification = Object.freeze(
    structuredClone
      ? structuredClone(input.specification)
      : JSON.parse(JSON.stringify(input.specification))
  ) as CreateRuntimeVersionInput["specification"];

  return Object.freeze({
    versionId: nextVersionId(input.organizationId, input.versionId),
    createdAt,
    state: "draft",
    specification: Object.freeze(specification),
    checksum: checksumRuntimeSpecification(specification),
    generatorVersion: input.generatorVersion ?? RUNTIME_GENERATOR_VERSION,
    industryId: input.industryId,
    industryBlueprintVersion: input.industryBlueprintVersion,
    organizationId: input.organizationId,
    organizationBlueprintVersion: input.organizationBlueprintVersion,
    packageId: input.packageId,
    applicationId: input.applicationId,
    capabilityPackVersions: Object.freeze([
      ...(input.capabilityPackVersions ?? []),
    ]),
    parentVersionId: input.parentVersionId,
    approvals: Object.freeze([]),
    labels: input.labels ? Object.freeze([...input.labels]) : undefined,
  });
}
