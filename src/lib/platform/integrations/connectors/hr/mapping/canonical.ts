import type { HrKgKind, HrObjectType } from "@/lib/platform/integrations/connectors/hr/entities";

/** Provider-neutral dotted JAG types. */
export const CANONICAL_TYPE: Record<HrObjectType, string> = {
  employee: "person.employee",
  payroll: "hr.payroll",
  benefit: "hr.benefit",
  time_off: "hr.time_off",
  pto: "hr.time_off",
  department: "hr.department",
  manager: "hr.manager",
  hiring: "hr.hiring",
};

export const KG_KIND_FOR_OBJECT: Partial<Record<HrObjectType, HrKgKind>> = {
  employee: "Employee",
  payroll: "FinancialTransaction",
  benefit: "Document",
  time_off: "Task",
  pto: "Task",
  department: "Organization",
  manager: "Person",
  hiring: "Initiative",
};

export function hrCanonicalType(objectType: string): string {
  return CANONICAL_TYPE[objectType as HrObjectType] ?? `hr.${objectType}`;
}

export function hrKgKind(objectType: string): HrKgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as HrObjectType] ?? null;
}
