/**
 * RC-3.05 — HR Connectors
 * ADP, Gusto, Paylocity, BambooHR → shared canonical HR entities (no vendor models leave).
 */

export const HR_PROVIDERS = ["adp", "gusto", "paylocity", "bamboohr"] as const;
export type HrProvider = (typeof HR_PROVIDERS)[number];

export const HR_OBJECT_TYPES = [
  "employee",
  "payroll",
  "benefit",
  "time_off",
  "department",
  "manager",
  "hiring",
  /** Legacy alias kept for Sprint 078 parity — normalized as Time Off. */
  "pto",
] as const;

export type HrObjectType = (typeof HR_OBJECT_TYPES)[number];

export const HR_KG_KINDS = [
  "Employee",
  "Person",
  "Organization",
  "FinancialTransaction",
  "Document",
  "Task",
  "Initiative",
] as const;

export type HrKgKind = (typeof HR_KG_KINDS)[number];

export type HrRawEntity = {
  id: string;
  objectType: HrObjectType;
  provider: HrProvider;
  organizationId: string;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type HrCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: HrProvider;
  syncedAt: string;
  version: number;
  objectType: HrObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
