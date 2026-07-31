/**
 * Healthcare industry — Organization Studio profile (data only).
 */

import type { IndustryStudioProfile } from "@/jag/blueprints/contracts";

export const HEALTHCARE_STUDIO_PROFILE: IndustryStudioProfile = Object.freeze({
  locationKinds: Object.freeze([
    "hospital",
    "clinic",
    "region",
    "office",
  ]),
  suggestedPrograms: Object.freeze([
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
      id: "surgery",
      label: "Surgery",
      category: "acute",
    }),
    Object.freeze({
      id: "telehealth",
      label: "Telehealth",
      category: "modality",
    }),
  ]),
  suggestedRoles: Object.freeze([
    Object.freeze({ id: "ceo", label: "CEO" }),
    Object.freeze({ id: "cmo", label: "Chief Medical Officer" }),
    Object.freeze({ id: "nursing_director", label: "Nursing Director" }),
    Object.freeze({ id: "provider", label: "Provider" }),
    Object.freeze({ id: "care_coordinator", label: "Care Coordinator" }),
  ]),
  suggestedCalendars: Object.freeze([
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
  suggestedPolicies: Object.freeze([
    Object.freeze({ id: "hipaa", label: "HIPAA", category: "compliance" }),
    Object.freeze({ id: "consent", label: "Consent", category: "compliance" }),
    Object.freeze({
      id: "documentation",
      label: "Documentation",
      category: "operations",
    }),
    Object.freeze({
      id: "medication",
      label: "Medication",
      category: "clinical",
    }),
    Object.freeze({ id: "privacy", label: "Privacy", category: "compliance" }),
  ]),
  questionHints: Object.freeze({
    locations: "Which hospitals, clinics, and regions do you operate?",
    programs: "Which care programs and service lines are in scope?",
    roles: "Which clinical and administrative roles exist?",
    policies: "Which organizational policies govern care delivery?",
    modules:
      "Enable foundation modules (identity, documents, communications, scheduling, work, decision, policy, reporting, analytics) plus healthcare verticals (patients, encounters, care).",
  }),
});
