/**
 * Education Industry Blueprint v2 — primarily declarative industry knowledge.
 *
 * Foundation behavior comes from production Capability Packs (attached by
 * Organization Blueprints). This blueprint owns vocabulary, modules, catalogs,
 * and studio suggestions — not runtime logic or package ids.
 */

import type { IndustryBlueprint } from "@/jag/blueprints/contracts";
import { educationIndustryCatalogPayload } from "@/jag/blueprints/industries/education/catalogs";
import { EDUCATION_BLUEPRINT_COMPOSITION } from "@/jag/blueprints/industries/education/composition";
import { EDUCATION_INDUSTRY_ENTITIES } from "@/jag/blueprints/industries/education/entities";
import { EDUCATION_STUDIO_PROFILE } from "@/jag/blueprints/industries/education/studio-profile";

export const EDUCATION_INDUSTRY_ID = "education" as const;

export const EducationIndustryBlueprint: IndustryBlueprint = Object.freeze({
  id: EDUCATION_INDUSTRY_ID,
  label: "Education",
  description:
    "Declarative education industry blueprint — vocabulary, modules, and catalogs. Shared behavior is composed from foundation Capability Packs by organizations.",
  version: EDUCATION_BLUEPRINT_COMPOSITION.version,
  tags: Object.freeze([
    "education",
    "sis",
    "admissions",
    "scheduling",
    "declarative",
    "v2",
  ]),
  modules: Object.freeze([
    ...EDUCATION_BLUEPRINT_COMPOSITION.foundationModules,
    ...EDUCATION_BLUEPRINT_COMPOSITION.verticalModules,
  ]),
  studioProfile: EDUCATION_STUDIO_PROFILE,
  entities: EDUCATION_INDUSTRY_ENTITIES,
  terminology: Object.freeze([
    Object.freeze({
      id: "industry.education.terminology.default",
      label: "Education default terminology",
      terms: Object.freeze({
        learner: "Student",
        guardian: "Parent/Guardian",
        site: "Campus",
        academicLevel: "Academic Level",
        readingLevel: "Reading Level",
        structuredLiteracyLevel: "Structured Literacy Level",
        section: "Section",
        term: "Term",
      }),
    }),
  ]),
  permissions: Object.freeze([
    Object.freeze({
      id: "industry.education.permission.core",
      label: "Education core permissions",
      description: "Baseline education permission catalog (industry data).",
      permissions: Object.freeze([
        "education.access",
        "education.students.read",
        "education.students.update",
        "education.admissions.read",
        "education.enrollment.read",
        "education.scheduling.read",
        "education.reports.read",
      ]),
    }),
  ]),
  reports: Object.freeze([
    Object.freeze({
      id: "industry.education.report.student_roster",
      applicationId: "education",
      title: "Student Roster",
      domain: "sis",
      entityType: "Student",
      fields: Object.freeze(["legalName", "studentId", "grade", "status"]),
      requiredPermission: "education.reports.read",
      version: "1.0.0",
    }),
    Object.freeze({
      id: "industry.education.report.enrollment",
      applicationId: "education",
      title: "Enrollment Report",
      domain: "enrollment",
      entityType: "Enrollment",
      fields: Object.freeze(["studentId", "programId", "startDate", "status"]),
      requiredPermission: "education.reports.read",
      version: "1.0.0",
    }),
  ]),
  integrations: Object.freeze([
    Object.freeze({
      id: "industry.education.integration.sis",
      kind: "sis",
      label: "Student Information System",
    }),
    Object.freeze({
      id: "industry.education.integration.admissions",
      kind: "admissions",
      label: "Admissions Pipeline",
    }),
    Object.freeze({
      id: "industry.education.integration.scheduling",
      kind: "scheduling",
      label: "Scheduling & Timetable",
    }),
  ]),
  configuration: Object.freeze({
    keys: Object.freeze({
      industry: "education",
      blueprintEdition: "v2",
      supportsVirtualPrograms: true,
      supportsInPersonPrograms: true,
      composition: EDUCATION_BLUEPRINT_COMPOSITION,
      catalogs: educationIndustryCatalogPayload(),
    }),
  }),
});
