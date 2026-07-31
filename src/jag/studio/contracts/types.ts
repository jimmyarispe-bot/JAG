/**
 * Organization Studio contracts — answers in, Organization Blueprint out.
 */

import type {
  IndustryBlueprint,
  IndustryId,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";

export type StudioQuestionType =
  | "text"
  | "textarea"
  | "url"
  | "timezone"
  | "string_list"
  | "location_list"
  | "program_list"
  | "role_list"
  | "calendar_list"
  | "policy_list"
  | "integration_list"
  | "module_list"
  | "ai_bundle";

export type StudioQuestion = {
  readonly id: string;
  readonly section: StudioSectionId;
  readonly prompt: string;
  readonly type: StudioQuestionType;
  readonly required?: boolean;
  readonly hint?: string;
};

export type StudioSectionId =
  | "identity"
  | "locations"
  | "programs"
  | "roles"
  | "calendars"
  | "policies"
  | "integrations"
  | "ai"
  | "modules";

export type StudioLocationAnswer = {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly region?: string;
  readonly country?: string;
};

export type StudioProgramAnswer = {
  readonly id: string;
  readonly label: string;
  readonly category?: string;
};

export type StudioRoleAnswer = {
  readonly id: string;
  readonly label: string;
};

export type StudioCalendarAnswer = {
  readonly id: string;
  readonly kind: "fiscal" | "academic" | "operational" | (string & {});
  readonly label: string;
};

export type StudioPolicyAnswer = {
  readonly id: string;
  readonly label: string;
  readonly category?: string;
};

export type StudioIntegrationAnswer = {
  readonly id: string;
  readonly provider: string;
  readonly enabled: boolean;
  readonly label?: string;
};

export type StudioAiAnswers = {
  readonly modules?: readonly string[];
  readonly automations?: readonly string[];
  readonly assistants?: readonly string[];
};

export type StudioIdentityAnswers = {
  readonly name: string;
  readonly mission?: string;
  readonly vision?: string;
  readonly logoUrl?: string;
  readonly brand?: string;
  readonly timeZone: string;
  readonly languages: readonly string[];
};

/**
 * Organization Studio answers — human-describable organization knowledge.
 * Not a blueprint editor; the Studio produces the blueprint.
 */
export type OrganizationStudioAnswers = {
  readonly industryId: IndustryId;
  readonly organizationId: string;
  readonly packageId: string;
  readonly applicationId: string;
  readonly version: string;
  readonly publisher?: string;
  readonly tags?: readonly string[];
  readonly identity: StudioIdentityAnswers;
  readonly locations: readonly StudioLocationAnswer[];
  readonly programs: readonly StudioProgramAnswer[];
  readonly roles: readonly StudioRoleAnswer[];
  readonly calendars: readonly StudioCalendarAnswer[];
  readonly policies: readonly StudioPolicyAnswer[];
  readonly integrations: readonly StudioIntegrationAnswer[];
  readonly ai: StudioAiAnswers;
  readonly enabledModules: readonly string[];
  readonly disabledModules?: readonly string[];
  readonly terminologyOverrides?: Readonly<Record<string, string>>;
};

export type ProduceOrganizationBlueprintInput = {
  readonly industry: IndustryBlueprint;
  readonly answers: OrganizationStudioAnswers;
};

export type ProduceOrganizationBlueprintResult = {
  readonly ok: boolean;
  readonly organization?: OrganizationBlueprint;
  readonly industryId: IndustryId;
  readonly organizationId: string;
  readonly error?: { readonly code: string; readonly message: string };
};
