/**
 * Education industry — Organization Studio profile (data only).
 */

import type { IndustryStudioProfile } from "@/jag/blueprints/contracts";

export const EDUCATION_STUDIO_PROFILE: IndustryStudioProfile = Object.freeze({
  locationKinds: Object.freeze([
    "campus",
    "office",
    "region",
    "country",
  ]),
  suggestedPrograms: Object.freeze([
    Object.freeze({ id: "reading", label: "Reading", category: "literacy" }),
    Object.freeze({ id: "writing", label: "Writing", category: "literacy" }),
    Object.freeze({ id: "math", label: "Math", category: "numeracy" }),
    Object.freeze({
      id: "virtual_full_school",
      label: "Virtual Full School",
      category: "modality",
    }),
    Object.freeze({
      id: "in_person",
      label: "In-Person",
      category: "modality",
    }),
  ]),
  suggestedRoles: Object.freeze([
    Object.freeze({ id: "ceo", label: "CEO" }),
    Object.freeze({ id: "principal", label: "Principal" }),
    Object.freeze({ id: "teacher", label: "Teacher" }),
    Object.freeze({ id: "counselor", label: "Counselor" }),
    Object.freeze({ id: "registrar", label: "Registrar" }),
  ]),
  suggestedCalendars: Object.freeze([
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
  suggestedPolicies: Object.freeze([
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
    Object.freeze({
      id: "code_of_conduct",
      label: "Code of Conduct",
      category: "student_life",
    }),
    Object.freeze({
      id: "records_retention",
      label: "Student Records Retention",
      category: "compliance",
    }),
  ]),
  questionHints: Object.freeze({
    locations: "How many campuses do you operate?",
    programs: "Which programs do families enroll in?",
    roles: "Which leadership and instructional roles exist?",
    policies: "Which governance policies apply across campuses?",
    modules:
      "Enable foundation modules (identity, documents, communications, scheduling, work, decision, policy, reporting, analytics) plus education verticals (admissions, sis).",
  }),
});

