/**
 * Proof Organization Blueprint — third-party attach of scheduling.core
 * with declarative identity / documents / communications dependencies.
 */

import type { OrganizationBlueprint } from "@/jag/blueprints";
import {
  EDUCATION_INDUSTRY_ENTITIES,
  EducationIndustryBlueprint,
} from "@/jag/blueprints";
import { buildCommunicationsCapabilityPacks } from "@/packages/communications/capability-packs";
import { buildDocumentsCapabilityPacks } from "@/packages/documents/capability-packs";
import { buildIdentityCapabilityPacks } from "@/packages/identity/capability-packs";
import { buildSchedulingCapabilityPacks } from "@/packages/scheduling/capability-packs";
import { schedulingPackCatalogPayload } from "@/packages/scheduling/capability-packs/assemble";
import {
  SCHEDULING_APPLICATION_ID,
  SCHEDULING_PACKAGE_ID,
  SCHEDULING_PACKAGE_VERSION,
} from "@/packages/scheduling/package";

export function buildSchedulingProofOrganizationBlueprint(): OrganizationBlueprint {
  const packs = Object.freeze([
    ...buildIdentityCapabilityPacks(),
    ...buildDocumentsCapabilityPacks(),
    ...buildCommunicationsCapabilityPacks(),
    ...buildSchedulingCapabilityPacks(),
  ]);

  return Object.freeze({
    id: "proof.organization.scheduling",
    industryId: EducationIndustryBlueprint.id,
    packageId: SCHEDULING_PACKAGE_ID,
    applicationId: SCHEDULING_APPLICATION_ID,
    displayName: "Scheduling Proof Organization",
    description:
      "Proof tenant for Universal Organizational Scheduling (scheduling.core).",
    version: SCHEDULING_PACKAGE_VERSION,
    publisher: "JAG",
    tags: Object.freeze(["scheduling", "proof", "production-pack"]),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
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
        organization: "scheduling-proof",
        brand: "Scheduling Proof Organization",
        schedulingCatalogs: schedulingPackCatalogPayload(),
        source: "scheduling-pack-proof",
      }),
    }),
  });
}
