/**
 * Enterprise Connectors (Sprint 078) — CRM, HR, Education, Government.
 * All adapters normalize into shared canonical KG kinds (no provider-specific models).
 */

export const ENTERPRISE_PROVIDERS = [
  // Government (LMS education moved to connectors/education — RC-3.06)
  "state_education",
  "scholarship",
  "medicaid",
  "grant",
] as const;

export type EnterpriseProvider = (typeof ENTERPRISE_PROVIDERS)[number];

export const ENTERPRISE_DOMAINS = ["crm", "hr", "education", "government"] as const;
export type EnterpriseDomain = (typeof ENTERPRISE_DOMAINS)[number];

export const ENTERPRISE_OBJECT_TYPES = [
  // CRM
  "contact",
  "company",
  "deal",
  "activity",
  "pipeline",
  // HR
  "employee",
  "payroll",
  "benefit",
  "pto",
  "hiring",
  // Education
  "student",
  "class",
  "assignment",
  "grade",
  "attendance",
  // Government / programs
  "program",
  "application",
  "award",
  "claim",
  "compliance",
] as const;

export type EnterpriseObjectType = (typeof ENTERPRISE_OBJECT_TYPES)[number];

/**
 * Canonical Knowledge Graph kinds — every Sprint 073–078 connector contributes
 * into this shared ontology (phase exit criteria).
 */
export const ENTERPRISE_KG_KINDS = [
  "Person",
  "Organization",
  "Communication",
  "Meeting",
  "Document",
  "FinancialTransaction",
  "Student",
  "Employee",
  "Initiative",
  "Portfolio",
  "Risk",
  "Decision",
  "Opportunity",
  "Task",
] as const;

export type EnterpriseKgKind = (typeof ENTERPRISE_KG_KINDS)[number];

export type EnterpriseRawEntity = {
  id: string;
  objectType: EnterpriseObjectType;
  provider: EnterpriseProvider;
  organizationId: string;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type EnterpriseCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: EnterpriseProvider;
  syncedAt: string;
  version: number;
  objectType: EnterpriseObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};

export const PROVIDER_DOMAIN: Record<EnterpriseProvider, EnterpriseDomain> = {
  state_education: "government",
  scholarship: "government",
  medicaid: "government",
  grant: "government",
};
