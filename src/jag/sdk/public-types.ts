/**
 * JAG SDK v1 — public TypeScript contracts for third-party authors.
 * Only supported extension types. Internal compiler/runtime types are not re-exported.
 */

export type {
  IndustryId,
  IndustryBlueprint,
  OrganizationBlueprint,
  IndustryStudioProfile,
  CapabilityPack,
  CapabilityPackDependency,
  CapabilityPackStatus,
  CapabilityPackLicense,
  CapabilityPackCompatibility,
} from "@/jag/blueprints/contracts";

export type {
  IndustryCatalogPayload,
  CatalogEntry,
  IndustryBlueprintComposition,
  FoundationCapabilityBinding,
  FrameworkValidationResult,
  FrameworkValidationIssue,
} from "@/jag/blueprint-framework";

export type {
  OrganizationStudioAnswers,
  StudioIdentityAnswers,
  StudioLocationAnswer,
  StudioProgramAnswer,
  StudioRoleAnswer,
  StudioCalendarAnswer,
  StudioPolicyAnswer,
  StudioIntegrationAnswer,
  StudioAiAnswers,
} from "@/jag/studio/contracts";

export type {
  CapabilityPackValidationResult,
  CapabilityPackValidationIssue,
} from "@/jag/capability-packs/contracts";

export type SdkValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly {
    readonly path: string;
    readonly code: string;
    readonly message: string;
    readonly severity?: "error" | "warning";
  }[];
};

export type ScaffoldFile = {
  readonly path: string;
  readonly contents: string;
};

export type ScaffoldResult = {
  readonly ok: boolean;
  readonly kind: "industry" | "organization" | "capability-pack";
  readonly id: string;
  readonly files: readonly ScaffoldFile[];
  readonly notes: readonly string[];
};
