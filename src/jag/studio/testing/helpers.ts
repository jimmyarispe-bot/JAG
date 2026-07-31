import type { OrganizationBlueprint } from "@/jag/blueprints/contracts";
import type { OrganizationStudioAnswers } from "@/jag/studio/contracts";

export function studioAnswersSummary(answers: OrganizationStudioAnswers): {
  organizationId: string;
  locationCount: number;
  programCount: number;
  roleCount: number;
  enabledModules: string[];
  enabledIntegrations: string[];
} {
  return {
    organizationId: answers.organizationId,
    locationCount: answers.locations.length,
    programCount: answers.programs.length,
    roleCount: answers.roles.length,
    enabledModules: [...answers.enabledModules].sort(),
    enabledIntegrations: answers.integrations
      .filter((i) => i.enabled)
      .map((i) => i.provider)
      .sort(),
  };
}

export function organizationBlueprintKnowledgeKeys(
  organization: OrganizationBlueprint
): string[] {
  const knowledge = organization.configuration?.keys.organizationKnowledge as
    | { identity?: { name?: string }; locations?: unknown[] }
    | undefined;
  return Object.keys(knowledge ?? {}).sort();
}
