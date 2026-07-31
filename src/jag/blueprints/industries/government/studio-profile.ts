/**
 * Government industry — Organization Studio profile (data only).
 */

import type { IndustryStudioProfile } from "@/jag/blueprints/contracts";

export const GOVERNMENT_STUDIO_PROFILE: IndustryStudioProfile = Object.freeze({
  locationKinds: Object.freeze([
    "city_hall",
    "department",
    "facility",
    "district",
  ]),
  suggestedPrograms: Object.freeze([
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
  suggestedRoles: Object.freeze([
    Object.freeze({ id: "mayor", label: "Mayor" }),
    Object.freeze({ id: "city_manager", label: "City Manager" }),
    Object.freeze({ id: "council_member", label: "Council Member" }),
    Object.freeze({ id: "department_director", label: "Department Director" }),
    Object.freeze({ id: "clerk", label: "City Clerk" }),
  ]),
  suggestedCalendars: Object.freeze([
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
  suggestedPolicies: Object.freeze([
    Object.freeze({ id: "ethics", label: "Ethics", category: "compliance" }),
    Object.freeze({
      id: "procurement",
      label: "Procurement",
      category: "finance",
    }),
    Object.freeze({
      id: "records_retention",
      label: "Records Retention",
      category: "compliance",
    }),
    Object.freeze({
      id: "public_access",
      label: "Public Access",
      category: "compliance",
    }),
    Object.freeze({
      id: "financial_controls",
      label: "Financial Controls",
      category: "finance",
    }),
  ]),
  questionHints: Object.freeze({
    locations: "Which city hall, departments, and districts do you operate?",
    programs: "Which civic programs and service lines are in scope?",
    roles: "Which elected, appointed, and administrative roles exist?",
    policies: "Which organizational policies govern city operations?",
    modules:
      "Enable foundation modules (identity, documents, communications, scheduling, work, decision, policy, reporting, analytics) plus government verticals (cases, constituents, permits).",
  }),
});
