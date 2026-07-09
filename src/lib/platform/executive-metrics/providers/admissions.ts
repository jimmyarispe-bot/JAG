import { buildMetric, statusFromHigherIsBetter } from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/** Admissions domain — admissions executive metrics + home pipeline count. */
export function provideAdmissionsMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const adm = sources.admissions;
  const home = sources.dashboard;
  const cc = sources.commandCenter;

  const pipeline =
    home?.admissionsPipeline ?? cc?.admissionsPipeline ?? adm?.activeLeads ?? null;

  return [
    buildMetric({
      id: "admissions.pipeline_active",
      name: "Active Pipeline",
      domain: "admissions",
      source: "dashboard.metrics / admissions.executive-metrics",
      value: pipeline,
      unit: "count",
      zeroIsValid: true,
      confidence: pipeline == null ? undefined : "High",
      lastUpdated: now,
    }),
    buildMetric({
      id: "admissions.new_inquiries_30d",
      name: "New Inquiries (30d)",
      domain: "admissions",
      source: "admissions.executive-metrics",
      value: adm?.newInquiries ?? null,
      unit: "count",
      zeroIsValid: true,
      confidence: adm ? "High" : undefined,
      lastUpdated: now,
    }),
    buildMetric({
      id: "admissions.acceptance_rate",
      name: "Acceptance Rate",
      domain: "admissions",
      source: "admissions.executive-metrics",
      value: adm?.acceptanceRate ?? null,
      unit: "percent",
      zeroIsValid: true,
      confidence: adm?.acceptanceRate == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(adm?.acceptanceRate ?? null, 40, 25, 15),
      lastUpdated: now,
    }),
    buildMetric({
      id: "admissions.enrollment_conversion_rate",
      name: "Enrollment Conversion Rate",
      domain: "admissions",
      source: "admissions.executive-metrics",
      value: adm?.enrollmentConversionRate ?? null,
      unit: "percent",
      zeroIsValid: true,
      confidence: adm?.enrollmentConversionRate == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(adm?.enrollmentConversionRate ?? null, 30, 15, 8),
      lastUpdated: now,
    }),
    buildMetric({
      id: "admissions.forecasted_tuition",
      name: "Forecasted Tuition",
      domain: "admissions",
      source: "admissions.executive-metrics",
      value: adm ? adm.forecastedTuition : null,
      unit: "currency",
      zeroIsValid: true,
      confidence: adm ? "Low" : undefined,
      lastUpdated: now,
    }),
    buildMetric({
      id: "admissions.avg_days_inquiry_to_acceptance",
      name: "Avg Days Inquiry → Acceptance",
      domain: "admissions",
      source: "admissions.executive-metrics",
      value: adm?.avgDaysInquiryToAcceptance ?? null,
      unit: "days",
      zeroIsValid: true,
      confidence: adm?.avgDaysInquiryToAcceptance == null ? undefined : "Medium",
      lastUpdated: now,
    }),
  ];
}
