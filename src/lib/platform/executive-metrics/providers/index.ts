import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";
import { provideEnrollmentMetrics } from "@/lib/platform/executive-metrics/providers/enrollment";
import { provideAdmissionsMetrics } from "@/lib/platform/executive-metrics/providers/admissions";
import { provideFinanceMetrics } from "@/lib/platform/executive-metrics/providers/finance";
import { provideStaffingMetrics } from "@/lib/platform/executive-metrics/providers/staffing";
import { provideAttendanceMetrics } from "@/lib/platform/executive-metrics/providers/attendance";
import { provideComplianceMetrics } from "@/lib/platform/executive-metrics/providers/compliance";
import { provideOperationsMetrics } from "@/lib/platform/executive-metrics/providers/operations";
import { provideExecutiveMetrics } from "@/lib/platform/executive-metrics/providers/executive";
import type { ExecutiveMetricDomain } from "@/lib/platform/executive-metrics/types";

export type ExecutiveMetricProvider = (
  sources: ExecutiveMetricsSourceBundle
) => ExecutiveMetric[];

export const EXECUTIVE_METRIC_PROVIDERS: Record<
  ExecutiveMetricDomain,
  ExecutiveMetricProvider
> = {
  enrollment: provideEnrollmentMetrics,
  admissions: provideAdmissionsMetrics,
  finance: provideFinanceMetrics,
  staffing: provideStaffingMetrics,
  attendance: provideAttendanceMetrics,
  compliance: provideComplianceMetrics,
  operations: provideOperationsMetrics,
  executive: provideExecutiveMetrics,
};

export {
  provideEnrollmentMetrics,
  provideAdmissionsMetrics,
  provideFinanceMetrics,
  provideStaffingMetrics,
  provideAttendanceMetrics,
  provideComplianceMetrics,
  provideOperationsMetrics,
  provideExecutiveMetrics,
};
