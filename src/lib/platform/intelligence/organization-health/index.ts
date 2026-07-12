/**
 * Organization Health — public API (Sprint 023 / 024).
 */

export type {
  AcademicHealth,
  ComplianceHealth,
  EnrollmentHealth,
  FinancialHealth,
  HealthMetric,
  HealthStatus,
  HealthTrend,
  OperationsHealth,
  OrganizationHealth,
  OrganizationHealthAggregate,
  WorkforceHealth,
} from "@/lib/platform/intelligence/organization-health/types";

export {
  evaluateEnrollmentHealth,
  type EnrollmentHealthResult,
} from "@/lib/platform/intelligence/organization-health/enrollment";

export {
  evaluateFinancialHealth,
  type FinancialHealthResult,
} from "@/lib/platform/intelligence/organization-health/financial";

export {
  evaluateAcademicHealth,
  type AcademicHealthResult,
} from "@/lib/platform/intelligence/organization-health/academic";

export {
  evaluateWorkforceHealth,
  type WorkforceHealthResult,
} from "@/lib/platform/intelligence/organization-health/workforce";

export {
  evaluateComplianceHealth,
  type ComplianceHealthResult,
} from "@/lib/platform/intelligence/organization-health/compliance";

export {
  evaluateOperationsHealth,
  type OperationsHealthResult,
} from "@/lib/platform/intelligence/organization-health/operations";
