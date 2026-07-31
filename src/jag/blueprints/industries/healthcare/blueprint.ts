/**
 * Healthcare Industry Blueprint v1 — primarily declarative industry knowledge.
 *
 * Foundation behavior comes from production Capability Packs (attached by
 * Organization Blueprints). This blueprint owns vocabulary, modules, catalogs,
 * and studio suggestions — not runtime logic, compliance engines, or package ids.
 *
 * Architectural validation only — not an EHR.
 */

import type { IndustryBlueprint } from "@/jag/blueprints/contracts";
import { healthcareIndustryCatalogPayload } from "@/jag/blueprints/industries/healthcare/catalogs";
import { HEALTHCARE_BLUEPRINT_COMPOSITION } from "@/jag/blueprints/industries/healthcare/composition";
import { HEALTHCARE_INDUSTRY_ENTITIES } from "@/jag/blueprints/industries/healthcare/entities";
import { HEALTHCARE_STUDIO_PROFILE } from "@/jag/blueprints/industries/healthcare/studio-profile";

export const HEALTHCARE_INDUSTRY_ID = "healthcare" as const;

export const HealthcareIndustryBlueprint: IndustryBlueprint = Object.freeze({
  id: HEALTHCARE_INDUSTRY_ID,
  label: "Healthcare",
  description:
    "Declarative healthcare industry blueprint — vocabulary, modules, and catalogs. Shared behavior is composed from foundation Capability Packs by organizations. Not an EHR; definitions only.",
  version: HEALTHCARE_BLUEPRINT_COMPOSITION.version,
  tags: Object.freeze([
    "healthcare",
    "patients",
    "encounters",
    "care",
    "declarative",
    "v1",
  ]),
  modules: Object.freeze([
    ...HEALTHCARE_BLUEPRINT_COMPOSITION.foundationModules,
    ...HEALTHCARE_BLUEPRINT_COMPOSITION.verticalModules,
  ]),
  studioProfile: HEALTHCARE_STUDIO_PROFILE,
  entities: HEALTHCARE_INDUSTRY_ENTITIES,
  terminology: Object.freeze([
    Object.freeze({
      id: "industry.healthcare.terminology.default",
      label: "Healthcare default terminology",
      terms: Object.freeze({
        patient: "Patient",
        provider: "Provider",
        clinician: "Clinician",
        careTeam: "Care Team",
        familyContact: "Family Contact",
        encounter: "Encounter",
        appointment: "Appointment",
        site: "Facility",
      }),
    }),
  ]),
  permissions: Object.freeze([
    Object.freeze({
      id: "industry.healthcare.permission.core",
      label: "Healthcare core permissions",
      description: "Baseline healthcare permission catalog (industry data).",
      permissions: Object.freeze([
        "healthcare.access",
        "healthcare.patients.read",
        "healthcare.patients.update",
        "healthcare.encounters.read",
        "healthcare.scheduling.read",
        "healthcare.reports.read",
      ]),
    }),
  ]),
  reports: Object.freeze([
    Object.freeze({
      id: "industry.healthcare.report.appointment_volume",
      applicationId: "healthcare",
      title: "Appointment Volume",
      domain: "scheduling",
      entityType: "ScheduleItem",
      fields: Object.freeze(["id", "status", "startAt", "schedulableType"]),
      requiredPermission: "healthcare.reports.read",
      version: "1.0.0",
    }),
    Object.freeze({
      id: "industry.healthcare.report.referral",
      applicationId: "healthcare",
      title: "Referral Report",
      domain: "care",
      entityType: "WorkItem",
      fields: Object.freeze(["id", "status", "workType", "title"]),
      requiredPermission: "healthcare.reports.read",
      version: "1.0.0",
    }),
  ]),
  integrations: Object.freeze([
    Object.freeze({
      id: "industry.healthcare.integration.ehr",
      kind: "ehr",
      label: "Electronic Health Record",
    }),
    Object.freeze({
      id: "industry.healthcare.integration.lab",
      kind: "lab",
      label: "Laboratory Interface",
    }),
    Object.freeze({
      id: "industry.healthcare.integration.scheduling",
      kind: "scheduling",
      label: "Scheduling & Appointments",
    }),
  ]),
  configuration: Object.freeze({
    keys: Object.freeze({
      industry: "healthcare",
      blueprintEdition: "v1",
      composition: HEALTHCARE_BLUEPRINT_COMPOSITION,
      catalogs: healthcareIndustryCatalogPayload(),
    }),
  }),
});
