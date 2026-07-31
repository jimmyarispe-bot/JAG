/**
 * Proof Organization Blueprint — third-party attach of policy.core
 * with declarative foundation packs (+ reporting.core for full stack proof).
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { buildCommunicationsCapabilityPacks } from "@/packages/communications/capability-packs";
import { buildDecisionCapabilityPacks } from "@/packages/decision/capability-packs";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";
import { buildPolicyCapabilityPacks } from "@/packages/policy/capability-packs";
import { policyPackCatalogPayload } from "@/packages/policy/capability-packs/assemble";
import {
  POLICY_APPLICATION_ID,
  POLICY_PACKAGE_ID,
  POLICY_PACKAGE_VERSION,
} from "@/packages/policy/package";
import { buildReportingCapabilityPacks } from "@/packages/reporting/capability-packs";
import { buildSchedulingCapabilityPacks } from "@/packages/scheduling/capability-packs";
import { buildWorkCapabilityPacks } from "@/packages/work/capability-packs";

export function buildPolicyProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
    ...buildSchedulingCapabilityPacks(),
    ...buildWorkCapabilityPacks(),
    ...buildDecisionCapabilityPacks(),
    ...buildReportingCapabilityPacks(),
    ...buildPolicyCapabilityPacks(),
  ]);

  return Object.freeze({
    id: "proof.organization.policy",
    industryId: EducationIndustryBlueprint.id,
    packageId: POLICY_PACKAGE_ID,
    applicationId: POLICY_APPLICATION_ID,
    displayName: "Policy Proof Organization",
    description:
      "Proof tenant for Universal Organizational Policy (policy.core).",
    version: POLICY_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["policy", "proof", "production-pack"]),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
      "decision",
      "reporting",
      "policy",
    ]),
    capabilityPacks: packs,
    disableEntityTypes: Object.freeze(
      EDUCATION_INDUSTRY_ENTITIES.map((e) => e.entityType)
    ),
    disablePermissionIds: Object.freeze(
      (EducationIndustryBlueprint.permissions ?? []).map((p) => p.id)
    ),
    disableReportIds: Object.freeze(
      (EducationIndustryBlueprint.reports ?? []).map((r) => r.id)
    ),
    disableTerminologyIds: Object.freeze(
      (EducationIndustryBlueprint.terminology ?? []).map((t) => t.id)
    ),
    disableIntegrationIds: Object.freeze(
      (EducationIndustryBlueprint.integrations ?? []).map((i) => i.id)
    ),
    configuration: Object.freeze({
      keys: Object.freeze({
        organization: "policy-proof",
        brand: "Policy Proof Organization",
        policyCatalogs: policyPackCatalogPayload(),
        source: "policy-pack-proof",
      }),
    }),
  });
}
