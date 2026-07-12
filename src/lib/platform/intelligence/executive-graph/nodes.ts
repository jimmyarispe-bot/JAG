/**
 * Executive Graph Analyzer — domain node catalogs (Sprint 025).
 */

import type { SignalCatalog } from "@/lib/platform/intelligence/executive-graph/contracts";
import type {
  DomainRelationInput,
  DomainSignalInput,
} from "@/lib/platform/intelligence/executive-graph/types";

/** Canonical domain root + KPI signal keys. */
export const DOMAIN_NODE_CATALOG: DomainSignalInput[] = [
  { key: "admissions.root", label: "Admissions", domain: "admissions", kind: "domain_root" },
  { key: "admissions.pipeline", label: "Admissions Pipeline", domain: "admissions", kind: "kpi" },
  { key: "admissions.conversion", label: "Admissions Conversion", domain: "admissions", kind: "kpi" },

  { key: "finance.root", label: "Finance", domain: "finance", kind: "domain_root" },
  { key: "finance.revenue", label: "Revenue", domain: "finance", kind: "kpi" },
  { key: "finance.cash", label: "Cash Position", domain: "finance", kind: "kpi" },
  { key: "finance.collections", label: "Collections", domain: "finance", kind: "kpi" },
  { key: "finance.outstanding", label: "Outstanding AR", domain: "finance", kind: "kpi" },

  { key: "hr.root", label: "Human Resources", domain: "hr", kind: "domain_root" },
  { key: "hr.staffing", label: "Staffing Level", domain: "hr", kind: "kpi" },
  { key: "hr.teacher_attendance", label: "Teacher Attendance", domain: "hr", kind: "kpi" },
  { key: "hr.vacancies", label: "Vacancies", domain: "hr", kind: "signal" },

  { key: "operations.root", label: "Operations", domain: "operations", kind: "domain_root" },
  { key: "operations.enrollment", label: "Enrollment", domain: "operations", kind: "kpi" },
  { key: "operations.attendance", label: "Student Attendance", domain: "operations", kind: "kpi" },
  { key: "operations.scheduling", label: "Scheduling Accuracy", domain: "operations", kind: "kpi" },

  { key: "executive.root", label: "Executive Intelligence", domain: "executive", kind: "domain_root" },
  { key: "executive.health", label: "Organization Health Score", domain: "executive", kind: "health" },
  { key: "executive.alerts", label: "Executive Alerts", domain: "executive", kind: "alert" },

  { key: "founder.root", label: "Founder Intelligence", domain: "founder", kind: "domain_root" },
  { key: "founder.brief", label: "Founder Brief", domain: "founder", kind: "summary" },
  { key: "founder.priorities", label: "Founder Priorities", domain: "founder", kind: "priority" },
];

/** Default cross-domain causal / dependency relations. */
export const DOMAIN_RELATION_CATALOG: DomainRelationInput[] = [
  {
    sourceKey: "admissions.pipeline",
    targetKey: "operations.enrollment",
    kind: "CONTRIBUTES_TO",
    direction: "positive",
    ruleId: "ega.admissions_to_enrollment",
    reason: "Pipeline volume feeds enrollment",
    weight: 0.8,
    confidence: 0.75,
  },
  {
    sourceKey: "operations.enrollment",
    targetKey: "finance.revenue",
    kind: "GENERATES",
    direction: "positive",
    ruleId: "ega.enrollment_to_revenue",
    reason: "Enrollment drives tuition revenue",
    weight: 0.9,
    confidence: 0.8,
  },
  {
    sourceKey: "finance.collections",
    targetKey: "finance.cash",
    kind: "CONTRIBUTES_TO",
    direction: "positive",
    ruleId: "ega.collections_to_cash",
    reason: "Collections improve cash position",
    weight: 0.85,
    confidence: 0.8,
  },
  {
    sourceKey: "finance.outstanding",
    targetKey: "finance.cash",
    kind: "DECLINES",
    direction: "negative",
    ruleId: "ega.ar_to_cash",
    reason: "Outstanding AR pressures cash",
    weight: 0.7,
    confidence: 0.7,
  },
  {
    sourceKey: "finance.revenue",
    targetKey: "finance.cash",
    kind: "CONTRIBUTES_TO",
    direction: "positive",
    ruleId: "ega.revenue_to_cash",
    reason: "Revenue supports cash",
    weight: 0.75,
    confidence: 0.7,
  },
  {
    sourceKey: "hr.staffing",
    targetKey: "operations.scheduling",
    kind: "SUPPORTS",
    direction: "positive",
    ruleId: "ega.staffing_to_scheduling",
    reason: "Staffing enables schedule coverage",
    weight: 0.7,
    confidence: 0.65,
  },
  {
    sourceKey: "hr.teacher_attendance",
    targetKey: "operations.attendance",
    kind: "CONTRIBUTES_TO",
    direction: "positive",
    ruleId: "ega.teacher_to_student_attendance",
    reason: "Teacher presence supports student attendance",
    weight: 0.6,
    confidence: 0.55,
  },
  {
    sourceKey: "hr.vacancies",
    targetKey: "operations.scheduling",
    kind: "BLOCKS",
    direction: "negative",
    ruleId: "ega.vacancies_block_scheduling",
    reason: "Vacancies constrain scheduling capacity",
    weight: 0.8,
    confidence: 0.7,
  },
  {
    sourceKey: "operations.attendance",
    targetKey: "executive.health",
    kind: "CONTRIBUTES_TO",
    direction: "positive",
    ruleId: "ega.attendance_to_health",
    reason: "Attendance informs organization health",
    weight: 0.55,
    confidence: 0.6,
  },
  {
    sourceKey: "finance.cash",
    targetKey: "executive.health",
    kind: "CONTRIBUTES_TO",
    direction: "positive",
    ruleId: "ega.cash_to_health",
    reason: "Cash position informs organization health",
    weight: 0.7,
    confidence: 0.7,
  },
  {
    sourceKey: "executive.health",
    targetKey: "founder.brief",
    kind: "INFORMS",
    direction: "neutral",
    ruleId: "ega.health_to_founder",
    reason: "Health score feeds founder brief",
    weight: 0.9,
    confidence: 0.85,
  },
  {
    sourceKey: "executive.alerts",
    targetKey: "founder.priorities",
    kind: "INFORMS",
    direction: "negative",
    ruleId: "ega.alerts_to_priorities",
    reason: "Alerts elevate founder priorities",
    weight: 0.75,
    confidence: 0.7,
  },
  {
    sourceKey: "founder.priorities",
    targetKey: "executive.root",
    kind: "DEPENDS_ON",
    direction: "neutral",
    ruleId: "ega.priorities_depend_executive",
    reason: "Founder priorities depend on executive signals",
    weight: 0.6,
    confidence: 0.65,
  },
];

export class DomainNodeCatalog implements SignalCatalog {
  defaultSignals(): DomainSignalInput[] {
    return DOMAIN_NODE_CATALOG.map((s) => ({ ...s }));
  }

  defaultRelations(): DomainRelationInput[] {
    return DOMAIN_RELATION_CATALOG.map((r) => ({ ...r }));
  }
}
