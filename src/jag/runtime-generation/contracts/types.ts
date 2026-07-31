/**
 * Runtime Generation Engine contracts.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  IndustryId,
  OrganizationBlueprint,
  RuntimeSpecification,
} from "@/jag/blueprints/contracts";
import type { BlueprintContributionBundle } from "@/jag/blueprints/contracts";

export type RuntimeArtifactKind =
  | "entities"
  | "processes"
  | "decisions"
  | "forms"
  | "documents"
  | "communications"
  | "permissions"
  | "reports"
  | "navigation"
  | "workflows"
  | "terminology"
  | "localization"
  | "integrations";

export type GenerationPlan = {
  readonly industryId: IndustryId;
  readonly organizationId: string;
  readonly packageId: string;
  readonly applicationId: string;
  readonly enabledModules: readonly string[];
  readonly disabledModules: readonly string[];
  readonly selectedPackIds: readonly string[];
  readonly requiredArtifacts: readonly RuntimeArtifactKind[];
  readonly organizationOverlayKeys: readonly string[];
};

export type ResolvedRuntimeModel = BlueprintContributionBundle & {
  readonly metadata: RuntimeSpecification["metadata"];
  readonly configuration: RuntimeSpecification["configuration"];
  readonly selectedPackIds: readonly string[];
  readonly enabledModules: readonly string[];
};

export type GenerationDiagnostic = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
};

export type GenerationValidationResult = {
  readonly ok: boolean;
  readonly diagnostics: readonly GenerationDiagnostic[];
};

export type RuntimeDiffChangeKind =
  | "added"
  | "removed"
  | "modified"
  | "breaking"
  | "safe";

export type RuntimeDiffEntry = {
  readonly kind: RuntimeArtifactKind | "metadata" | "configuration";
  readonly id: string;
  readonly change: RuntimeDiffChangeKind;
  readonly detail?: string;
};

export type RuntimeSpecificationDiff = {
  readonly added: readonly RuntimeDiffEntry[];
  readonly removed: readonly RuntimeDiffEntry[];
  readonly modified: readonly RuntimeDiffEntry[];
  readonly breaking: readonly RuntimeDiffEntry[];
  readonly safe: readonly RuntimeDiffEntry[];
};

export type GenerateRuntimeSpecificationInput = {
  readonly industry: IndustryBlueprint;
  readonly organization: OrganizationBlueprint;
  /** Extra packs not already on the organization blueprint. */
  readonly capabilityPacks?: readonly CapabilityPack[];
  readonly previousSpecification?: RuntimeSpecification;
};

export type GenerateRuntimeSpecificationResult = {
  readonly ok: boolean;
  readonly plan?: GenerationPlan;
  readonly resolved?: ResolvedRuntimeModel;
  readonly specification?: RuntimeSpecification;
  readonly diff?: RuntimeSpecificationDiff;
  readonly industryId: IndustryId;
  readonly organizationId: string;
  readonly diagnostics: readonly GenerationDiagnostic[];
  readonly error?: { readonly code: string; readonly message: string };
};
