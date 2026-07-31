/**
 * Organization Studio — produce Organization Blueprint from answers.
 */

import type {
  IndustryBlueprint,
  OrganizationBlueprint,
} from "@/jag/blueprints/contracts";
import type {
  OrganizationStudioAnswers,
  ProduceOrganizationBlueprintResult,
} from "@/jag/studio/contracts";
import { validateOrganizationStudioAnswers } from "@/jag/studio/validation";

function freezeAnswersConfig(answers: OrganizationStudioAnswers) {
  return Object.freeze({
    organizationKnowledge: Object.freeze({
      identity: Object.freeze({
        name: answers.identity.name,
        mission: answers.identity.mission,
        vision: answers.identity.vision,
        logoUrl: answers.identity.logoUrl,
        brand: answers.identity.brand ?? answers.identity.name,
        timeZone: answers.identity.timeZone,
        languages: Object.freeze([...answers.identity.languages]),
      }),
      locations: Object.freeze(answers.locations.map((l) => Object.freeze({ ...l }))),
      programs: Object.freeze(answers.programs.map((p) => Object.freeze({ ...p }))),
      roles: Object.freeze(answers.roles.map((r) => Object.freeze({ ...r }))),
      calendars: Object.freeze(
        answers.calendars.map((c) => Object.freeze({ ...c }))
      ),
      policies: Object.freeze(answers.policies.map((p) => Object.freeze({ ...p }))),
      ai: Object.freeze({
        modules: Object.freeze([...(answers.ai.modules ?? [])]),
        automations: Object.freeze([...(answers.ai.automations ?? [])]),
        assistants: Object.freeze([...(answers.ai.assistants ?? [])]),
      }),
    }),
    source: "organization-studio",
  });
}

/**
 * Transform Studio answers into an Organization Blueprint.
 * Contribution overlays (entities, processes, …) are not invented here —
 * packages or the future Runtime Generator attach those.
 */
export function produceOrganizationBlueprint(
  industry: IndustryBlueprint,
  answers: OrganizationStudioAnswers
): ProduceOrganizationBlueprintResult {
  const validation = validateOrganizationStudioAnswers(industry, answers);
  if (!validation.ok) {
    return {
      ok: false,
      industryId: industry.id,
      organizationId: answers.organizationId,
      error: {
        code: "studio_answers_invalid",
        message: validation.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const brand = answers.identity.brand ?? answers.identity.name;
  const enabledIntegrations = answers.integrations.filter((i) => i.enabled);

  const organization: OrganizationBlueprint = Object.freeze({
    id: answers.organizationId,
    industryId: answers.industryId,
    packageId: answers.packageId,
    applicationId: answers.applicationId,
    displayName: answers.identity.name,
    description:
      answers.identity.mission ??
      `${answers.identity.name} (${industry.label})`,
    version: answers.version,
    publisher: answers.publisher,
    tags: Object.freeze([
      ...new Set([
        industry.id,
        "organization-studio",
        ...(answers.tags ?? []),
      ]),
    ]),
    enabledModules: Object.freeze([...answers.enabledModules]),
    disabledModules: Object.freeze([...(answers.disabledModules ?? [])]),
    integrations: Object.freeze(
      enabledIntegrations.map((i) =>
        Object.freeze({
          id: i.id,
          kind: i.provider,
          label: i.label ?? i.provider,
          config: Object.freeze({ provider: i.provider, enabled: true }),
        })
      )
    ),
    terminology: answers.terminologyOverrides
      ? Object.freeze([
          Object.freeze({
            id: `${answers.organizationId}.terminology`,
            label: `${brand} terminology`,
            terms: Object.freeze({ ...answers.terminologyOverrides }),
          }),
        ])
      : undefined,
    configuration: Object.freeze({
      keys: Object.freeze({
        organization: answers.packageId,
        brand,
        timeZone: answers.identity.timeZone,
        languages: Object.freeze([...answers.identity.languages]),
        logoUrl: answers.identity.logoUrl,
        mission: answers.identity.mission,
        vision: answers.identity.vision,
        ...freezeAnswersConfig(answers),
      }),
    }),
  });

  return {
    ok: true,
    organization,
    industryId: industry.id,
    organizationId: answers.organizationId,
  };
}
