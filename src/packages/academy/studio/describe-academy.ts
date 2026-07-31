/**
 * Academy Organization Studio answers — The Academy Way as answers, not YAML.
 */

import type { OrganizationStudioAnswers } from "@/jag/studio";
import { EDUCATION_INDUSTRY_ID } from "@/jag/blueprints";
import {
  ACADEMY_APPLICATION_ID,
  ACADEMY_PACKAGE_ID,
  ACADEMY_PACKAGE_VERSION,
} from "@/packages/academy/package";

/**
 * Describe The Academy as Organization Studio answers.
 * Humans would answer these questions; this is the proof fixture.
 */
export function describeAcademyOrganization(): OrganizationStudioAnswers {
  return Object.freeze({
    industryId: EDUCATION_INDUSTRY_ID,
    organizationId: "academy.organization",
    packageId: ACADEMY_PACKAGE_ID,
    applicationId: ACADEMY_APPLICATION_ID,
    version: ACADEMY_PACKAGE_VERSION,
    publisher: "The Academy",
    tags: Object.freeze(["academy", "the-academy-way", "sis", "scheduling"]),
    identity: Object.freeze({
      name: "The Academy",
      mission:
        "Deliver structured literacy and whole-child education across virtual and campus programs.",
      vision: "Every learner reads with confidence.",
      brand: "The Academy Way",
      timeZone: "America/New_York",
      languages: Object.freeze(["en"]),
    }),
    locations: Object.freeze([
      Object.freeze({
        id: "campus.fl",
        kind: "campus",
        name: "Florida Campus",
        region: "FL",
        country: "US",
      }),
      Object.freeze({
        id: "campus.ga",
        kind: "campus",
        name: "Georgia Campus",
        region: "GA",
        country: "US",
      }),
      Object.freeze({
        id: "region.southeast",
        kind: "region",
        name: "Southeast",
        country: "US",
      }),
    ]),
    programs: Object.freeze([
      Object.freeze({
        id: "reading",
        label: "Reading",
        category: "literacy",
      }),
      Object.freeze({
        id: "writing",
        label: "Writing",
        category: "literacy",
      }),
      Object.freeze({ id: "math", label: "Math", category: "numeracy" }),
      Object.freeze({
        id: "fl_virtual",
        label: "Florida Virtual",
        category: "modality",
      }),
      Object.freeze({
        id: "ga_virtual",
        label: "Georgia Virtual",
        category: "modality",
      }),
      Object.freeze({
        id: "in_person",
        label: "In-Person",
        category: "modality",
      }),
    ]),
    roles: Object.freeze([
      Object.freeze({ id: "ceo", label: "CEO" }),
      Object.freeze({ id: "principal", label: "Principal" }),
      Object.freeze({ id: "teacher", label: "Teacher" }),
      Object.freeze({ id: "registrar", label: "Registrar" }),
    ]),
    calendars: Object.freeze([
      Object.freeze({
        id: "academic",
        kind: "academic",
        label: "Academic Calendar",
      }),
      Object.freeze({
        id: "fiscal",
        kind: "fiscal",
        label: "Fiscal Calendar",
      }),
      Object.freeze({
        id: "operational",
        kind: "operational",
        label: "Operational Calendar",
      }),
    ]),
    policies: Object.freeze([
      Object.freeze({
        id: "attendance",
        label: "Attendance",
        category: "operations",
      }),
      Object.freeze({ id: "leave", label: "Leave", category: "hr" }),
      Object.freeze({
        id: "holidays",
        label: "Holidays",
        category: "operations",
      }),
    ]),
    integrations: Object.freeze([
      Object.freeze({
        id: "google",
        provider: "google",
        enabled: true,
        label: "Google",
      }),
      Object.freeze({
        id: "microsoft",
        provider: "microsoft",
        enabled: true,
        label: "Microsoft",
      }),
      Object.freeze({
        id: "stripe",
        provider: "stripe",
        enabled: false,
        label: "Stripe",
      }),
    ]),
    ai: Object.freeze({
      modules: Object.freeze(["literacy_coach"]),
      automations: Object.freeze(["enrollment_reminders"]),
      assistants: Object.freeze(["family_guide"]),
    }),
    enabledModules: Object.freeze([
      // Education foundation modules → production Capability Packs
      "identity",
      "documents",
      "communications",
      "scheduling",
      "work",
      "decision",
      "policy",
      "reporting",
      "analytics",
      // Education verticals → Academy package (transitional)
      "admissions",
      "sis",
      "reports",
    ]),
    terminologyOverrides: Object.freeze({
      learner: "Student",
      guardian: "Parent/Guardian",
      site: "Campus",
    }),
  });
}
