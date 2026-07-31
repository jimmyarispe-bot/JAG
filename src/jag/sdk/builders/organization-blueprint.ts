/**
 * Organization Builder — Organization Blueprint factory.
 */

import type {
  CapabilityPack,
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import type { OrganizationStudioAnswers } from "@/jag/studio/contracts";
import { produceOrganizationBlueprint } from "@/jag/studio";

export type BuildOrganizationBlueprintInput = {
  readonly industry: IndustryBlueprint;
  readonly answers: OrganizationStudioAnswers;
  /** Organization-owned pack attachment (never put pack ids on the industry). */
  readonly capabilityPacks?: readonly CapabilityPack[];
  readonly displayName?: string;
  readonly description?: string;
  readonly brand?: string;
  readonly extraConfigurationKeys?: Readonly<Record<string, unknown>>;
};

export type BuildOrganizationBlueprintResult = {
  readonly ok: boolean;
  readonly organization?: OrganizationBlueprint;
  readonly error?: { readonly code: string; readonly message: string };
};

/**
 * Produce an Organization Blueprint from Studio answers + optional pack attachment.
 * Uses Organization Studio (supported extension point) — not Compiler/Runtime internals.
 */
export function buildOrganizationBlueprint(
  input: BuildOrganizationBlueprintInput
): BuildOrganizationBlueprintResult {
  const produced = produceOrganizationBlueprint(
    input.industry,
    input.answers
  );
  if (!produced.ok || !produced.organization) {
    return {
      ok: false,
      error: produced.error ?? {
        code: "organization_build_failed",
        message: "Failed to produce organization blueprint",
      },
    };
  }

  const studio = produced.organization;
  const organization: OrganizationBlueprint = Object.freeze({
    ...studio,
    displayName: input.displayName ?? studio.displayName,
    description:
      input.description ??
      studio.description ??
      "Organization overlay produced via JAG SDK",
    capabilityPacks: input.capabilityPacks
      ? Object.freeze([...input.capabilityPacks])
      : studio.capabilityPacks,
    configuration: Object.freeze({
      keys: Object.freeze({
        ...(studio.configuration?.keys ?? {}),
        brand: input.brand ?? input.answers.identity.brand,
        compositionSource: "jag-sdk",
        ...(input.extraConfigurationKeys ?? {}),
      }),
    }),
  });

  return { ok: true, organization };
}

/** Minimal Studio answers helper for scaffolds / examples. */
export function buildDefaultOrganizationAnswers(input: {
  readonly industryId: string;
  readonly organizationId: string;
  readonly packageId: string;
  readonly applicationId: string;
  readonly version?: string;
  readonly name: string;
  readonly brand?: string;
  readonly enabledModules: readonly string[];
  readonly locations?: OrganizationStudioAnswers["locations"];
}): OrganizationStudioAnswers {
  return Object.freeze({
    industryId: input.industryId,
    organizationId: input.organizationId,
    packageId: input.packageId,
    applicationId: input.applicationId,
    version: input.version ?? "1.0.0",
    publisher: input.name,
    tags: Object.freeze([input.industryId, input.packageId]),
    identity: Object.freeze({
      name: input.name,
      brand: input.brand ?? input.name,
      timeZone: "America/New_York",
      languages: Object.freeze(["en"]),
    }),
    locations: Object.freeze(
      input.locations ?? [
        Object.freeze({
          id: "hq",
          kind: "office",
          name: "Headquarters",
          country: "US",
        }),
      ]
    ),
    programs: Object.freeze([]),
    roles: Object.freeze([
      Object.freeze({ id: "admin", label: "Administrator" }),
    ]),
    calendars: Object.freeze([
      Object.freeze({
        id: "operational",
        kind: "operational",
        label: "Operational Calendar",
      }),
    ]),
    policies: Object.freeze([]),
    integrations: Object.freeze([]),
    ai: Object.freeze({
      modules: Object.freeze([]),
      automations: Object.freeze([]),
      assistants: Object.freeze([]),
    }),
    enabledModules: Object.freeze([...input.enabledModules]),
  });
}
