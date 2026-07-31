/**
 * Proof Organization Blueprint — third-party attach of decision.core
 * with declarative foundation dependency packs.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { buildCommunicationsCapabilityPacks } from "@/packages/communications/capability-packs";
import { buildDecisionCapabilityPacks } from "@/packages/decision/capability-packs";
import { decisionPackCatalogPayload } from "@/packages/decision/capability-packs/assemble";
import {
  DECISION_APPLICATION_ID,
  DECISION_PACKAGE_ID,
  DECISION_PACKAGE_VERSION,
} from "@/packages/decision/package";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";
import { buildSchedulingCapabilityPacks } from "@/packages/scheduling/capability-packs";
import { buildWorkCapabilityPacks } from "@/packages/work/capability-packs";

export function buildDecisionProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
    ...buildSchedulingCapabilityPacks(),
    ...buildWorkCapabilityPacks(),
    ...buildDecisionCapabilityPacks(),
  ]);

  return Object.freeze({
    id: "proof.organization.decision",
    industryId: EducationIndustryBlueprint.id,
    packageId: DECISION_PACKAGE_ID,
    applicationId: DECISION_APPLICATION_ID,
    displayName: "Decision Proof Organization",
    description:
      "Proof tenant for Universal Organizational Decision (decision.core).",
    version: DECISION_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["decision", "proof", "production-pack"]),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
      "decision",
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
        organization: "decision-proof",
        brand: "Decision Proof Organization",
        decisionCatalogs: decisionPackCatalogPayload(),
        source: "decision-pack-proof",
      }),
    }),
  });
}
