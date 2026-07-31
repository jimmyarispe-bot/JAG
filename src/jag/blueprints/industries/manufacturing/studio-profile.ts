/**
 * Manufacturing industry — Organization Studio profile (data only).
 */

import type { IndustryStudioProfile } from "@/jag/blueprints/contracts";

export const MANUFACTURING_STUDIO_PROFILE: IndustryStudioProfile = Object.freeze(
  {
    locationKinds: Object.freeze([
      "plant",
      "warehouse",
      "office",
      "region",
    ]),
    suggestedPrograms: Object.freeze([
      Object.freeze({
        id: "discrete_assembly",
        label: "Discrete Assembly",
        category: "production",
      }),
      Object.freeze({
        id: "quality_assurance",
        label: "Quality Assurance",
        category: "quality",
      }),
      Object.freeze({
        id: "maintenance",
        label: "Maintenance",
        category: "operations",
      }),
      Object.freeze({
        id: "shipping",
        label: "Shipping & Logistics",
        category: "logistics",
      }),
    ]),
    suggestedRoles: Object.freeze([
      Object.freeze({ id: "ceo", label: "CEO" }),
      Object.freeze({ id: "plant_manager", label: "Plant Manager" }),
      Object.freeze({ id: "supervisor", label: "Supervisor" }),
      Object.freeze({ id: "operator", label: "Operator" }),
      Object.freeze({ id: "technician", label: "Technician" }),
    ]),
    suggestedCalendars: Object.freeze([
      Object.freeze({
        id: "production",
        kind: "operational",
        label: "Production Calendar",
      }),
      Object.freeze({
        id: "maintenance",
        kind: "operational",
        label: "Maintenance Calendar",
      }),
      Object.freeze({
        id: "fiscal",
        kind: "fiscal",
        label: "Fiscal Calendar",
      }),
    ]),
    suggestedPolicies: Object.freeze([
      Object.freeze({ id: "safety", label: "Safety", category: "compliance" }),
      Object.freeze({ id: "quality", label: "Quality", category: "compliance" }),
      Object.freeze({
        id: "maintenance",
        label: "Maintenance",
        category: "operations",
      }),
      Object.freeze({
        id: "environmental",
        label: "Environmental",
        category: "compliance",
      }),
    ]),
    questionHints: Object.freeze({
      locations: "Which plants, warehouses, and regions do you operate?",
      programs: "Which production and support programs are in scope?",
      roles: "Which plant leadership and shop-floor roles exist?",
      policies: "Which organizational policies govern manufacturing operations?",
      modules:
        "Enable foundation modules (identity, documents, communications, scheduling, work, decision, policy, reporting, analytics) plus manufacturing verticals (bom, work_orders, inventory).",
    }),
  }
);
