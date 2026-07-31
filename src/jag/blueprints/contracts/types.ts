/**
 * Blueprint Engine contracts — industry knowledge vs organization identity.
 */

import type {
  ApplicationModel,
  ConfigurationModel,
  IntegrationModel,
  LocalizationModel,
  TerminologyModel,
  WorkflowModel,
} from "@/jag/modeling/application-model";
import type { CommunicationModelBundle } from "@/jag/modeling/communication-model";
import type { DecisionModel } from "@/jag/modeling/decision-model";
import type { DocumentModelBundle } from "@/jag/modeling/document-model";
import type { EntityModel } from "@/jag/modeling/entity-model";
import type { FormModel } from "@/jag/modeling/form-model";
import type { NavigationModel } from "@/jag/modeling/navigation-model";
import type { PermissionModel } from "@/jag/modeling/permission-model";
import type { ProcessModel } from "@/jag/modeling/process-model";
import type { ReportModel } from "@/jag/modeling/report-model";

/** Canonical industry identifiers. */
export type IndustryId =
  | "education"
  | "healthcare"
  | "manufacturing"
  | "government"
  | "nonprofit"
  | "retail"
  | (string & {});

/**
 * Runtime Specification — what the Model Compiler executes.
 * Alias of ApplicationModel (Sprint 014) with clearer architectural naming.
 */
export type RuntimeSpecification = ApplicationModel;

/** @deprecated Prefer RuntimeSpecification — retained for Sprint 014 compatibility. */
export type ApplicationSpecification = RuntimeSpecification;

export type BlueprintContributionBundle = {
  readonly entities?: readonly EntityModel[];
  readonly processes?: readonly ProcessModel[];
  readonly decisions?: readonly DecisionModel[];
  readonly forms?: readonly FormModel[];
  readonly documents?: DocumentModelBundle;
  readonly communications?: CommunicationModelBundle;
  readonly permissions?: readonly PermissionModel[];
  readonly reports?: readonly ReportModel[];
  readonly navigation?: readonly NavigationModel[];
  readonly workflows?: readonly WorkflowModel[];
  readonly terminology?: readonly TerminologyModel[];
  readonly localization?: readonly LocalizationModel[];
  readonly integrations?: readonly IntegrationModel[];
};

/**
 * Capability pack lifecycle status (Sprint 019 Architecture).
 * Full behavioral APIs live in `@/jag/capability-packs`.
 */
export type CapabilityPackStatus =
  | "draft"
  | "published"
  | "deprecated"
  | "retired";

export type CapabilityPackLicense = {
  readonly id: string;
  readonly name: string;
  readonly spdx?: string;
  readonly url?: string;
  readonly commercial?: boolean;
};

export type CapabilityPackDependency = {
  readonly packId: string;
  /** Semver range: exact, `*`, `^1.2.0`, or `>=1.0.0`. */
  readonly versionRange: string;
  readonly optional?: boolean;
};

export type CapabilityPackCompatibility = {
  readonly jagRuntimeMin?: string;
  readonly jagRuntimeMax?: string;
  /** Empty / omit = all industries; otherwise allow-list. */
  readonly industryIds?: readonly IndustryId[];
  readonly requiresModules?: readonly string[];
};

export type CapabilityPackDeprecation = {
  readonly since: string;
  readonly successorPackId?: string;
  readonly message?: string;
};

export type CapabilityPackUpgradePath = {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly breaking: boolean;
  readonly migrationNotes?: string;
};

export type CapabilityPackDiscoveryMeta = {
  readonly category?: string;
  readonly keywords?: readonly string[];
  readonly featured?: boolean;
};

/**
 * Capability pack — installable contribution unit (app-store equivalent at architecture level).
 * Contributions are resolved by Runtime Generation; governance by Capability Pack Architecture.
 */
export type CapabilityPack = BlueprintContributionBundle & {
  readonly id: string;
  readonly label: string;
  /** Display name; defaults to label when omitted. */
  readonly name?: string;
  readonly description?: string;
  readonly version?: string;
  readonly publisher?: string;
  /**
   * Modules this pack provides / satisfies when enabled
   * (intersected with organization enabledModules).
   */
  readonly modules?: readonly string[];
  /** Alias of modules — preferred in new packs. */
  readonly providesModules?: readonly string[];
  readonly tags?: readonly string[];
  readonly status?: CapabilityPackStatus;
  readonly license?: CapabilityPackLicense;
  readonly dependencies?: readonly CapabilityPackDependency[];
  readonly compatibility?: CapabilityPackCompatibility;
  readonly deprecated?: CapabilityPackDeprecation;
  readonly upgrades?: readonly CapabilityPackUpgradePath[];
  readonly discovery?: CapabilityPackDiscoveryMeta;
};

/**
 * Industry suggestions for Organization Studio (data only).
 * Vocabulary may be industry-specific; engines remain agnostic.
 */
export type IndustryStudioProfile = {
  readonly locationKinds?: readonly string[];
  readonly suggestedPrograms?: readonly {
    readonly id: string;
    readonly label: string;
    readonly category?: string;
  }[];
  readonly suggestedRoles?: readonly {
    readonly id: string;
    readonly label: string;
  }[];
  readonly suggestedCalendars?: readonly {
    readonly id: string;
    readonly kind: string;
    readonly label: string;
  }[];
  readonly suggestedPolicies?: readonly {
    readonly id: string;
    readonly label: string;
    readonly category?: string;
  }[];
  readonly questionHints?: Readonly<Record<string, string>>;
};

/**
 * Industry Blueprint — common industry knowledge as data.
 * No organization branding or package ids.
 */
export type IndustryBlueprint = BlueprintContributionBundle & {
  readonly id: IndustryId;
  readonly label: string;
  readonly description?: string;
  readonly version: string;
  readonly tags?: readonly string[];
  /** Recommended module keys orgs may enable (e.g. sis, scheduling, reports). */
  readonly modules?: readonly string[];
  /** Suggested Studio questions / catalogs for this industry. */
  readonly studioProfile?: IndustryStudioProfile;
  readonly configuration?: ConfigurationModel;
};

/**
 * Organization Blueprint — organization identity + overlays on an industry.
 */
export type OrganizationBlueprint = BlueprintContributionBundle & {
  readonly id: string;
  readonly industryId: IndustryId;
  readonly packageId: string;
  readonly applicationId: string;
  readonly displayName: string;
  readonly description?: string;
  readonly version: string;
  readonly publisher?: string;
  readonly tags?: readonly string[];
  /** Industry modules to include (default: all industry modules). */
  readonly enabledModules?: readonly string[];
  /** Modules/contribution ids explicitly disabled. */
  readonly disabledModules?: readonly string[];
  /**
   * Drop industry (or merged) contributions after overlay.
   * Use when the organization supplies a complete replacement set.
   */
  readonly disableEntityTypes?: readonly string[];
  readonly disablePermissionIds?: readonly string[];
  readonly disableReportIds?: readonly string[];
  readonly disableTerminologyIds?: readonly string[];
  readonly disableIntegrationIds?: readonly string[];
  readonly disableProcessIds?: readonly string[];
  readonly disableDecisionIds?: readonly string[];
  readonly disableFormIds?: readonly string[];
  /**
   * Optional capability packs carried by the organization.
   * Expanded by Runtime Generation (Industry → packs → org overlays).
   */
  readonly capabilityPacks?: readonly CapabilityPack[];
  readonly configuration?: ConfigurationModel;
};

export type MaterializeBlueprintsInput = {
  readonly industry: IndustryBlueprint;
  readonly organization: OrganizationBlueprint;
};

export type MaterializeBlueprintsResult = {
  readonly ok: boolean;
  readonly specification?: RuntimeSpecification;
  readonly industryId: IndustryId;
  readonly organizationId: string;
  readonly error?: { readonly code: string; readonly message: string };
};
