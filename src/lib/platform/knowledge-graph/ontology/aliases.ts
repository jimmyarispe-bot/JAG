/**
 * Map connector / domain KG kind strings → unified entity types.
 */

import type { UnifiedEntityType } from "@/lib/platform/knowledge-graph/ontology/kinds";
import { UNIFIED_ENTITY_TYPES } from "@/lib/platform/knowledge-graph/ontology/kinds";

const KIND_SET = new Set<string>(UNIFIED_ENTITY_TYPES);

/** Connector-emitted kinds → RC-4 kinds. */
export const ENTITY_KIND_ALIASES: Record<string, UnifiedEntityType> = {
  Person: "Person",
  Organization: "Organization",
  Department: "Department",
  Meeting: "Meeting",
  Communication: "Communication",
  Document: "Document",
  Task: "Task",
  Decision: "Decision",
  Initiative: "Initiative",
  Portfolio: "Portfolio",
  Risk: "Risk",
  Opportunity: "Opportunity",
  FinancialTransaction: "FinancialTransaction",
  "Financial Transaction": "FinancialTransaction",
  Customer: "Customer",
  Vendor: "Vendor",
  Employee: "Employee",
  Student: "Student",
  Teacher: "Teacher",
  Parent: "Parent",
  Class: "Class",
  Course: "Course",
  // Domain extras
  Lead: "Person",
  Account: "Organization",
  Payment: "FinancialTransaction",
  Invoice: "FinancialTransaction",
  Subscription: "FinancialTransaction",
  Email: "Communication",
  Folder: "Document",
  Attendee: "Person",
  Owner: "Person",
};

/**
 * Prefer objectType when present for education/HR first-class kinds.
 */
export function resolveUnifiedEntityType(
  entityType: string,
  properties?: Record<string, unknown>
): UnifiedEntityType {
  const objectType =
    typeof properties?.objectType === "string" ? properties.objectType : null;
  const attrKind = typeof properties?.kind === "string" ? properties.kind : null;

  if (objectType === "department" || attrKind === "Department") return "Department";
  if (objectType === "teacher" || attrKind === "Teacher") return "Teacher";
  if (objectType === "parent" || attrKind === "Parent") return "Parent";
  if (objectType === "class") return "Class";
  if (objectType === "course" || attrKind === "Course") return "Course";
  if (objectType === "student") return "Student";
  if (objectType === "employee") return "Employee";
  if (objectType === "customer") return "Customer";
  if (objectType === "vendor") return "Vendor";

  const aliased = ENTITY_KIND_ALIASES[entityType];
  if (aliased) return aliased;
  if (KIND_SET.has(entityType)) return entityType as UnifiedEntityType;
  return "Document";
}
