import type {
  EnterpriseKgKind,
  EnterpriseObjectType,
} from "@/lib/platform/integrations/connectors/enterprise/entities";

/** Dotted JAG canonical types — provider-neutral before KG. */
export const CANONICAL_TYPE: Record<EnterpriseObjectType, string> = {
  contact: "crm.contact",
  company: "crm.account",
  deal: "crm.opportunity",
  activity: "crm.activity",
  pipeline: "crm.pipeline",
  employee: "person.employee",
  payroll: "hr.payroll",
  benefit: "hr.benefit",
  pto: "hr.pto",
  hiring: "hr.hiring",
  student: "education.student",
  class: "education.class",
  assignment: "education.assignment",
  grade: "education.grade",
  attendance: "education.attendance",
  program: "gov.program",
  application: "gov.application",
  award: "finance.award",
  claim: "gov.claim",
  compliance: "gov.compliance",
};

/** Map object types → shared KG kinds (Sprint 078 expansion). */
export const KG_KIND_FOR_OBJECT: Partial<Record<EnterpriseObjectType, EnterpriseKgKind>> = {
  contact: "Person",
  company: "Organization",
  deal: "Opportunity",
  activity: "Task",
  pipeline: "Portfolio",
  employee: "Employee",
  payroll: "FinancialTransaction",
  benefit: "Document",
  pto: "Task",
  hiring: "Initiative",
  student: "Student",
  class: "Organization",
  assignment: "Task",
  grade: "Document",
  attendance: "Document",
  program: "Initiative",
  application: "Document",
  award: "FinancialTransaction",
  claim: "FinancialTransaction",
  compliance: "Risk",
};

export function enterpriseCanonicalType(objectType: string): string {
  return (
    CANONICAL_TYPE[objectType as EnterpriseObjectType] ?? `enterprise.${objectType}`
  );
}

export function enterpriseKgKind(objectType: string): EnterpriseKgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as EnterpriseObjectType] ?? null;
}
