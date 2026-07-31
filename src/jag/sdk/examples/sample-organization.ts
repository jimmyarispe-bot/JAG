/**
 * SDK example — organization overlay built only via @/jag/sdk.
 */

import {
  buildDefaultOrganizationAnswers,
  buildOrganizationBlueprint,
  listFoundationModules,
  validateOrganization,
} from "@/jag/sdk";
import { exampleNonprofitIndustryBlueprint } from "./sample-industry";
import { exampleAssetManagementPack } from "./sample-capability-pack";

export function buildExampleCommunityFoundationOrganization() {
  const answers = buildDefaultOrganizationAnswers({
    industryId: exampleNonprofitIndustryBlueprint.id,
    organizationId: "community-foundation.organization",
    packageId: "community-foundation",
    applicationId: "community-foundation",
    name: "Community Foundation (SDK Example)",
    brand: "Community Foundation",
    enabledModules: Object.freeze([
      ...listFoundationModules(),
      "fundraising",
      "volunteers",
    ]),
    locations: Object.freeze([
      Object.freeze({
        id: "hq",
        kind: "office",
        name: "Main Office",
        region: "Metro",
        country: "US",
      }),
    ]),
  });

  return buildOrganizationBlueprint({
    industry: exampleNonprofitIndustryBlueprint,
    answers,
    capabilityPacks: Object.freeze([exampleAssetManagementPack]),
    displayName: "Community Foundation (SDK Example)",
    brand: "Community Foundation",
  });
}

export function validateExampleCommunityFoundationOrganization() {
  const built = buildExampleCommunityFoundationOrganization();
  if (!built.ok || !built.organization) {
    return {
      ok: false as const,
      issues: Object.freeze([
        Object.freeze({
          path: "organization",
          code: built.error?.code ?? "build_failed",
          message: built.error?.message ?? "Organization build failed",
        }),
      ]),
    };
  }
  return validateOrganization(built.organization);
}
