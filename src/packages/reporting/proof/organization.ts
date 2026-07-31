/**
 * Proof Organization Blueprint — third-party attach of reporting.core
 * with declarative foundation dependency packs.
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
import { buildReportingCapabilityPacks } from "@/packages/reporting/capability-packs";
import { reportingPackCatalogPayload } from "@/packages/reporting/capability-packs/assemble";
import {
  REPORTING_APPLICATION_ID,
  REPORTING_PACKAGE_ID,
  REPORTING_PACKAGE_VERSION,
} from "@/packages/reporting/package";
import { buildSchedulingCapabilityPacks } from "@/packages/scheduling/capability-packs";
import { buildWorkCapabilityPacks } from "@/packages/work/capability-packs";

export function buildReportingProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
    ...buildSchedulingCapabilityPacks(),
    ...buildWorkCapabilityPacks(),
    ...buildDecisionCapabilityPacks(),
    ...buildReportingCapabilityPacks(),
  ]);

  return Object.freeze({
    id: "proof.organization.reporting",
    industryId: EducationIndustryBlueprint.id,
    packageId: REPORTING_PACKAGE_ID,
    applicationId: REPORTING_APPLICATION_ID,
    displayName: "Reporting Proof Organization",
    description:
      "Proof tenant for Universal Organizational Reporting (reporting.core).",
    version: REPORTING_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["reporting", "proof", "production-pack"]),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
      "decision",
      "reporting",
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
        organization: "reporting-proof",
        brand: "Reporting Proof Organization",
        reportingCatalogs: reportingPackCatalogPayload(),
        source: "reporting-pack-proof",
      }),
    }),
  });
}
