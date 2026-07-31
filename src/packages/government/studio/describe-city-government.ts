/**
 * City Government — Organization Studio answers.
 * Branding, departments, structure, and org policies only.
 * Does not duplicate Government Industry Blueprint catalogs.
 */

import type { OrganizationStudioAnswers } from "@/jag/studio";
import { GOVERNMENT_INDUSTRY_ID } from "@/jag/blueprints";
import {
  CITY_GOVERNMENT_ORGANIZATION_ID,
  GOVERNMENT_APPLICATION_ID,
  GOVERNMENT_PACKAGE_ID,
  GOVERNMENT_PACKAGE_VERSION,
} from "@/packages/government/package";

/**
 * Describe City Government as Organization Studio answers.
 * Humans would answer these questions; this is the proof fixture.
 */
export function describeCityGovernmentOrganization(): OrganizationStudioAnswers {
  return Object.freeze({
    industryId: GOVERNMENT_INDUSTRY_ID,
    organizationId: CITY_GOVERNMENT_ORGANIZATION_ID,
    packageId: GOVERNMENT_PACKAGE_ID,
    applicationId: GOVERNMENT_APPLICATION_ID,
    version: GOVERNMENT_PACKAGE_VERSION,
    publisher: "City Government",
    tags: Object.freeze([
      "government",
      "city-government",
      "permits",
      "constituents",
    ]),
    identity: Object.freeze({
      name: "City Government",
      mission:
        "Deliver transparent, responsive municipal services for every resident.",
      vision: "A trusted city government that serves with integrity.",
      brand: "City of Progress",
      timeZone: "America/New_York",
      languages: Object.freeze(["en"]),
    }),
    locations: Object.freeze([
      Object.freeze({
        id: "city_hall",
        kind: "city_hall",
        name: "City Hall",
        region: "Downtown",
        country: "US",
      }),
      Object.freeze({
        id: "dept.public_works",
        kind: "department",
        name: "Public Works Department",
        region: "Downtown",
        country: "US",
      }),
      Object.freeze({
        id: "dept.planning",
        kind: "department",
        name: "Planning & Permits",
        region: "Downtown",
        country: "US",
      }),
      Object.freeze({
        id: "district.north",
        kind: "district",
        name: "North District",
        country: "US",
      }),
    ]),
    programs: Object.freeze([
      Object.freeze({
        id: "permits_licensing",
        label: "Permits & Licensing",
        category: "regulatory",
      }),
      Object.freeze({
        id: "public_works",
        label: "Public Works",
        category: "operations",
      }),
      Object.freeze({
        id: "community_services",
        label: "Community Services",
        category: "services",
      }),
      Object.freeze({
        id: "budget_finance",
        label: "Budget & Finance",
        category: "finance",
      }),
    ]),
    roles: Object.freeze([
      Object.freeze({ id: "mayor", label: "Mayor" }),
      Object.freeze({ id: "city_manager", label: "City Manager" }),
      Object.freeze({ id: "council_member", label: "Council Member" }),
      Object.freeze({ id: "department_director", label: "Department Director" }),
      Object.freeze({ id: "clerk", label: "City Clerk" }),
    ]),
    calendars: Object.freeze([
      Object.freeze({
        id: "council",
        kind: "operational",
        label: "Council Calendar",
      }),
      Object.freeze({
        id: "fiscal",
        kind: "fiscal",
        label: "Fiscal Calendar",
      }),
      Object.freeze({
        id: "public_hearings",
        kind: "operational",
        label: "Public Hearing Calendar",
      }),
    ]),
    policies: Object.freeze([
      Object.freeze({
        id: "ethics",
        label: "Ethics",
        category: "compliance",
      }),
      Object.freeze({
        id: "procurement",
        label: "Procurement",
        category: "finance",
      }),
      Object.freeze({
        id: "public_access",
        label: "Public Access",
        category: "compliance",
      }),
    ]),
    integrations: Object.freeze([
      Object.freeze({
        id: "gis",
        provider: "gis",
        enabled: false,
        label: "GIS",
      }),
      Object.freeze({
        id: "finance",
        provider: "finance",
        enabled: false,
        label: "Financial System",
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
      "cases",
      "constituents",
      "permits",
    ]),
    terminologyOverrides: Object.freeze({
      citizen: "Citizen",
      resident: "Resident",
      site: "Facility",
    }),
  });
}
