/**
 * Organization Health — pillar aggregate types (Sprint 023 / 024).
 *
 * Distinct from Founder `OrganizationHealth` summary and Sprint 014
 * `OrganizationHealthScore` monitoring band.
 */

export type HealthStatus = "excellent" | "healthy" | "warning" | "critical";

export type HealthTrend = "improving" | "stable" | "declining";

export interface HealthMetric {
  score: number;
  weight: number;
  status: HealthStatus;
  message: string;
  lastUpdated: Date;
}

export interface EnrollmentHealth extends HealthMetric {
  activeStudents: number;
  capacity: number;
  utilization: number;
  waitlist: number;
}

export interface FinancialHealth extends HealthMetric {
  revenue: number;
  expenses: number;
  cashOnHand: number;
  operatingMargin: number;
}

export interface AcademicHealth extends HealthMetric {
  attendance: number;
  mastery: number;
  progress: number;
  interventionRate: number;
}

export interface WorkforceHealth extends HealthMetric {
  staffingLevel: number;
  vacancies: number;
  teacherAttendance: number;
  retentionRate: number;
}

export interface ComplianceHealth extends HealthMetric {
  openFindings: number;
  overdueItems: number;
  requiredTrainingsComplete: number;
}

export interface OperationsHealth extends HealthMetric {
  scheduledSessions: number;
  completedSessions: number;
  schedulingAccuracy: number;
}

/** Six-pillar organizational health aggregate. */
export interface OrganizationHealthAggregate {
  overallScore: number;
  status: HealthStatus;
  trend: HealthTrend;
  enrollment: EnrollmentHealth;
  financial: FinancialHealth;
  academic: AcademicHealth;
  workforce: WorkforceHealth;
  compliance: ComplianceHealth;
  operations: OperationsHealth;
  generatedAt: Date;
}

/** @deprecated Prefer {@link OrganizationHealthAggregate}. */
export type OrganizationHealth = OrganizationHealthAggregate;
