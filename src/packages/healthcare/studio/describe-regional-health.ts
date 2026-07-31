/**
 * Regional Health System — Organization Studio answers.
 * Branding, structure, locations, and org policies only.
 * Does not duplicate Healthcare Industry Blueprint catalogs.
 */

import type { OrganizationStudioAnswers } from "@/jag/studio";
import { HEALTHCARE_INDUSTRY_ID } from "@/jag/blueprints";
import {
  HEALTHCARE_APPLICATION_ID,
  HEALTHCARE_PACKAGE_ID,
  HEALTHCARE_PACKAGE_VERSION,
  REGIONAL_HEALTH_ORGANIZATION_ID,
} from "@/packages/healthcare/package";

/**
 * Describe Regional Health System as Organization Studio answers.
 * Humans would answer these questions; this is the proof fixture.
 */
export function describeRegionalHealthOrganization(): OrganizationStudioAnswers {
  return Object.freeze({
    industryId: HEALTHCARE_INDUSTRY_ID,
    organizationId: REGIONAL_HEALTH_ORGANIZATION_ID,
    packageId: HEALTHCARE_PACKAGE_ID,
    applicationId: HEALTHCARE_APPLICATION_ID,
    version: HEALTHCARE_PACKAGE_VERSION,
    publisher: "Regional Health System",
    tags: Object.freeze([
      "healthcare",
      "regional-health",
      "patients",
      "encounters",
    ]),
    identity: Object.freeze({
      name: "Regional Health System",
      mission:
        "Deliver coordinated, patient-centered care across hospitals and clinics in the region.",
      vision: "Healthier communities through connected care.",
      brand: "Regional Health",
      timeZone: "America/Chicago",
      languages: Object.freeze(["en"]),
    }),
    locations: Object.freeze([
      Object.freeze({
        id: "hospital.main",
        kind: "hospital",
        name: "Regional Medical Center",
        region: "Central",
        country: "US",
      }),
      Object.freeze({
        id: "clinic.north",
        kind: "clinic",
        name: "Northside Clinic",
        region: "North",
        country: "US",
      }),
      Object.freeze({
        id: "clinic.south",
        kind: "clinic",
        name: "Southside Clinic",
        region: "South",
        country: "US",
      }),
      Object.freeze({
        id: "region.metro",
        kind: "region",
        name: "Metro Region",
        country: "US",
      }),
    ]),
    programs: Object.freeze([
      Object.freeze({
        id: "primary_care",
        label: "Primary Care",
        category: "ambulatory",
      }),
      Object.freeze({
        id: "specialty_care",
        label: "Specialty Care",
        category: "ambulatory",
      }),
      Object.freeze({
        id: "emergency",
        label: "Emergency",
        category: "acute",
      }),
      Object.freeze({
        id: "telehealth",
        label: "Telehealth",
        category: "modality",
      }),
    ]),
    roles: Object.freeze([
      Object.freeze({ id: "ceo", label: "CEO" }),
      Object.freeze({ id: "cmo", label: "Chief Medical Officer" }),
      Object.freeze({ id: "provider", label: "Provider" }),
      Object.freeze({ id: "care_coordinator", label: "Care Coordinator" }),
    ]),
    calendars: Object.freeze([
      Object.freeze({
        id: "clinical",
        kind: "operational",
        label: "Clinical Calendar",
      }),
      Object.freeze({
        id: "fiscal",
        kind: "fiscal",
        label: "Fiscal Calendar",
      }),
      Object.freeze({
        id: "staffing",
        kind: "operational",
        label: "Staffing Calendar",
      }),
    ]),
    policies: Object.freeze([
      Object.freeze({
        id: "hipaa",
        label: "HIPAA",
        category: "compliance",
      }),
      Object.freeze({
        id: "consent",
        label: "Consent",
        category: "compliance",
      }),
      Object.freeze({
        id: "privacy",
        label: "Privacy",
        category: "compliance",
      }),
    ]),
    integrations: Object.freeze([
      Object.freeze({
        id: "ehr",
        provider: "ehr",
        enabled: false,
        label: "External EHR",
      }),
      Object.freeze({
        id: "lab",
        provider: "lab",
        enabled: false,
        label: "Laboratory",
      }),
    ]),
    ai: Object.freeze({
      modules: Object.freeze([]),
      automations: Object.freeze([]),
      assistants: Object.freeze([]),
    }),
    enabledModules: Object.freeze([
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
      "decision",
      "policy",
      "reporting",
      "analytics",
      "patients",
      "encounters",
      "care",
    ]),
    terminologyOverrides: Object.freeze({
      patient: "Patient",
      provider: "Provider",
      site: "Facility",
    }),
  });
}
