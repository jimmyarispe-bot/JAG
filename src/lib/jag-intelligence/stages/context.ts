import type { EiEventSignal } from "@/lib/founder-intelligence/events";
import { countByDomain } from "@/lib/founder-intelligence/events";
import {
  scoreAllDomains,
  scoreOverallHealth,
} from "@/lib/founder-intelligence/health";
import { detectRisks } from "@/lib/founder-intelligence/risks";
import type { OrganizationalContext } from "../types";

/** Stage 3 — Context Enrichment (queryable organizational context). */
export function stageContextEnrichment(
  signals: EiEventSignal[],
  now = new Date()
): OrganizationalContext {
  const counts = countByDomain(signals);
  const domains = scoreAllDomains(signals, now);
  const overall = scoreOverallHealth(domains, signals, now);
  const risks = detectRisks(signals, now);
  const compliance = signals.filter(
    (s) =>
      s.eventType.includes("certification") ||
      s.eventType.includes("compliance") ||
      s.eventType.includes("expiring")
  ).length;
  const pendingWorkflows = signals.filter(
    (s) =>
      s.eventType.includes("workflow") &&
      (s.eventType.includes("failed") || s.eventType.includes("pending"))
  ).length;

  return {
    capturedAt: now.toISOString(),
    activeEnrollmentSignals: counts.enrollment + counts.admissions + counts.students,
    staffingSignals: counts.human_capital,
    financialHealthScore:
      domains.find((d) => d.domain === "finance")?.score ?? overall.score,
    openRiskCount: risks.filter(
      (r) => r.severity === "high" || r.severity === "critical"
    ).length,
    recentCommunicationCount: counts.communications,
    pendingWorkflowSignals: pendingWorkflows,
    complianceAlertCount: compliance,
    domains: counts as unknown as Record<string, number>,
    factors: [
      `Overall health ${overall.score}`,
      `${risks.length} risks detected`,
      `${signals.length} EI signals in window`,
    ],
  };
}

export function queryContextField(
  context: OrganizationalContext,
  field: keyof OrganizationalContext
): unknown {
  return context[field];
}
