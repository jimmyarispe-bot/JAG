import {
  buildMetric,
  statusFromHigherIsBetter,
  statusFromLowerIsBetter,
} from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/**
 * Executive domain — rollups for narrative / health / KPI consumers.
 * Composed from already-loaded sources (no extra queries).
 */
export function provideExecutiveMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const cc = sources.commandCenter;
  const finance = sources.finance;
  const fi = sources.financialIntelligence;
  const mc = sources.missionControl;

  const avgSuccess = cc?.avgSuccessScore ?? null;
  const academicGrowth = cc?.academicGrowthPct ?? null;
  const intervention = cc?.interventionEffectiveness ?? null;
  // OEI/health scores come from full MC compose — not available on lightweight feed.
  // Use inverse of critical pressure as a coarse operational health proxy when present.
  const oei = null;
  const operationalHealth =
    mc == null
      ? null
      : Math.max(0, 100 - mc.criticalCount * 10 - mc.overdueTasks * 5);
  const financialRisks = fi?.financialRisks ?? null;
  const collection =
    finance == null || finance.invoiceCount === 0 ? null : finance.collectionRate;

  // Lightweight composite signal for Morning Brief / narrative (not OHE).
  const signalParts: number[] = [];
  if (oei != null) signalParts.push(oei);
  else if (operationalHealth != null) signalParts.push(operationalHealth);
  if (collection != null) signalParts.push(collection);
  if (avgSuccess != null) signalParts.push(avgSuccess);
  const executivePulse =
    signalParts.length > 0
      ? Math.round(signalParts.reduce((a, b) => a + b, 0) / signalParts.length)
      : null;

  return [
    buildMetric({
      id: "executive.operational_excellence_index",
      name: "Operational Excellence Index",
      domain: "executive",
      source: "mission-control",
      value: oei,
      unit: "score",
      zeroIsValid: true,
      confidence: oei == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(oei, 80, 65, 50),
      lastUpdated: now,
    }),
    buildMetric({
      id: "executive.operational_health_score",
      name: "Operational Health Score",
      domain: "executive",
      source: "mission-control",
      value: operationalHealth,
      unit: "score",
      zeroIsValid: true,
      confidence: operationalHealth == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(operationalHealth, 80, 65, 50),
      lastUpdated: now,
    }),
    buildMetric({
      id: "executive.avg_success_score",
      name: "Average Student Success Score",
      domain: "executive",
      source: "command-center",
      value: avgSuccess,
      unit: "score",
      zeroIsValid: true,
      confidence: avgSuccess == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(avgSuccess, 80, 65, 50),
      lastUpdated: now,
    }),
    buildMetric({
      id: "executive.academic_growth_pct",
      name: "Academic Growth",
      domain: "executive",
      source: "command-center",
      value: academicGrowth,
      unit: "percent",
      zeroIsValid: true,
      confidence: academicGrowth == null ? undefined : "Low",
      lastUpdated: now,
    }),
    buildMetric({
      id: "executive.intervention_effectiveness",
      name: "Intervention Effectiveness",
      domain: "executive",
      source: "command-center",
      value: intervention,
      unit: "percent",
      zeroIsValid: true,
      confidence: intervention == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(intervention, 70, 50, 30),
      lastUpdated: now,
    }),
    buildMetric({
      id: "executive.financial_risk_count",
      name: "Financial Risk Count",
      domain: "executive",
      source: "financial-intelligence.executive",
      value: financialRisks,
      unit: "count",
      zeroIsValid: true,
      confidence: fi ? "High" : undefined,
      status: statusFromLowerIsBetter(financialRisks, 0, 2, 5),
      lastUpdated: now,
    }),
    buildMetric({
      id: "executive.pulse_score",
      name: "Executive Pulse",
      domain: "executive",
      source: "executive-metrics.composite",
      value: executivePulse,
      unit: "score",
      zeroIsValid: true,
      confidence: executivePulse == null ? undefined : "Low",
      status: statusFromHigherIsBetter(executivePulse, 80, 65, 50),
      lastUpdated: now,
    }),
  ];
}
