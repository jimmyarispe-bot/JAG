/**
 * Capability Pack Architecture contracts — Sprint 019.
 * Types are owned with BlueprintContributionBundle on CapabilityPack
 * (`@/jag/blueprints`); this module owns governance behavior.
 */

import type {
  CapabilityPack,
  CapabilityPackStatus,
  IndustryId,
} from "@/jag/blueprints/contracts";

export type {
  CapabilityPack,
  CapabilityPackCompatibility,
  CapabilityPackDependency,
  CapabilityPackDeprecation,
  CapabilityPackDiscoveryMeta,
  CapabilityPackLicense,
  CapabilityPackStatus,
  CapabilityPackUpgradePath,
} from "@/jag/blueprints/contracts";

/** How an organization enables a pack. */
export type CapabilityPackEnablement = {
  readonly packId: string;
  readonly enabled: boolean;
  /** Pin a version when multiple are available. */
  readonly version?: string;
};

export type CapabilityPackValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
};

export type CapabilityPackValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly CapabilityPackValidationIssue[];
};

export type CapabilityPackResolutionContext = {
  readonly industryId: IndustryId;
  readonly enabledModules: readonly string[];
  readonly jagRuntimeVersion?: string;
  readonly availablePacks: readonly CapabilityPack[];
  readonly enablements?: readonly CapabilityPackEnablement[];
};

export type CapabilityPackSelectionResult = {
  readonly selected: readonly CapabilityPack[];
  readonly skipped: readonly {
    readonly packId: string;
    readonly reason: string;
  }[];
  readonly warnings: readonly string[];
};

export type CapabilityPackCatalogEntry = {
  readonly pack: CapabilityPack;
  readonly registeredAt: string;
};

export const CAPABILITY_PACK_STATUSES: readonly CapabilityPackStatus[] =
  Object.freeze(["draft", "published", "deprecated", "retired"]);
