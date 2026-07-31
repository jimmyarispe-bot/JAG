/**
 * Government Industry Blueprint v1 — primarily declarative industry knowledge.
 *
 * Foundation behavior comes from production Capability Packs (attached by
 * Organization Blueprints). This blueprint owns vocabulary, modules, catalogs,
 * and studio suggestions — not runtime logic, legislative engines, or package ids.
 *
 * Architectural validation only — definitions, not calculations.
 */

import type { IndustryBlueprint } from "@/jag/blueprints/contracts";
import { governmentIndustryCatalogPayload } from "@/jag/blueprints/industries/government/catalogs";
import { GOVERNMENT_BLUEPRINT_COMPOSITION } from "@/jag/blueprints/industries/government/composition";
import { GOVERNMENT_INDUSTRY_ENTITIES } from "@/jag/blueprints/industries/government/entities";
import { GOVERNMENT_STUDIO_PROFILE } from "@/jag/blueprints/industries/government/studio-profile";

export const GOVERNMENT_INDUSTRY_ID = "government" as const;

export const GovernmentIndustryBlueprint: IndustryBlueprint = Object.freeze({
  id: GOVERNMENT_INDUSTRY_ID,
  label: "Government",
  description:
    "Declarative government industry blueprint — vocabulary, modules, and catalogs. Shared behavior is composed from foundation Capability Packs by organizations. Definitions only — not legislative or optimization engines.",
  version: GOVERNMENT_BLUEPRINT_COMPOSITION.version,
  tags: Object.freeze([
    "government",
    "cases",
    "constituents",
    "permits",
    "declarative",
    "v1",
  ]),
  modules: Object.freeze([
    ...GOVERNMENT_BLUEPRINT_COMPOSITION.foundationModules,
    ...GOVERNMENT_BLUEPRINT_COMPOSITION.verticalModules,
  ]),
  studioProfile: GOVERNMENT_STUDIO_PROFILE,
  entities: GOVERNMENT_INDUSTRY_ENTITIES,
  terminology: Object.freeze([
    Object.freeze({
      id: "industry.government.terminology.default",
      label: "Government default terminology",
      terms: Object.freeze({
        citizen: "Citizen",
        resident: "Resident",
        electedOfficial: "Elected Official",
        appointedOfficial: "Appointed Official",
        departmentDirector: "Department Director",
        agencyEmployee: "Agency Employee",
        contractor: "Contractor",
        site: "Facility",
      }),
    }),
  ]),
  permissions: Object.freeze([
    Object.freeze({
      id: "industry.government.permission.core",
      label: "Government core permissions",
      description: "Baseline government permission catalog (industry data).",
      permissions: Object.freeze([
        "government.access",
        "government.constituents.read",
        "government.permits.read",
        "government.permits.update",
        "government.cases.read",
        "government.reports.read",
      ]),
    }),
  ]),
  reports: Object.freeze([
    Object.freeze({
      id: "industry.government.report.budget",
      applicationId: "government",
      title: "Budget Report",
      domain: "finance",
      entityType: "WorkItem",
      fields: Object.freeze(["id", "status", "workType", "title"]),
      requiredPermission: "government.reports.read",
      version: "1.0.0",
    }),
    Object.freeze({
      id: "industry.government.report.permit_activity",
      applicationId: "government",
      title: "Permit Activity Report",
      domain: "permits",
      entityType: "WorkItem",
      fields: Object.freeze(["id", "status", "workType", "title"]),
      requiredPermission: "government.reports.read",
      version: "1.0.0",
    }),
  ]),
  integrations: Object.freeze([
    Object.freeze({
      id: "industry.government.integration.gis",
      kind: "gis",
      label: "GIS / Mapping",
    }),
    Object.freeze({
      id: "industry.government.integration.finance",
      kind: "finance",
      label: "Financial System",
    }),
    Object.freeze({
      id: "industry.government.integration.scheduling",
      kind: "scheduling",
      label: "Council & Hearing Scheduling",
    }),
  ]),
  configuration: Object.freeze({
    keys: Object.freeze({
      industry: "government",
      blueprintEdition: "v1",
      composition: GOVERNMENT_BLUEPRINT_COMPOSITION,
      catalogs: governmentIndustryCatalogPayload(),
    }),
  }),
});
