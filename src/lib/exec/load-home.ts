import { INTELLIGENCE_MODULE_IDS } from "@/lib/platform/intelligence/infrastructure/types";
import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
import type { ExecHomeViewModel } from "@/lib/exec/view-models";

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Home dashboard composition — soft-reads OIOS + Wisdom + Opportunity stacks.
 * Domain builds use package baselines until connectors supply live inputs.
 */
export function loadExecHome(): ExecHomeViewModel {
  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
  const requestId = `exec-home-${Date.now()}`;

  const oios = intelligence.oios.service.build({ requestId: `${requestId}-oios`, scope });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
    oiosResult: oios,
  });
  const opportunity = intelligence.opportunity.service.build({
    requestId: `${requestId}-opp`,
    scope,
  });

  const criticalRisks = wisdom.risks
    .filter((r) => r.severity === "critical" || r.severity === "high")
    .slice(0, 3);
  const topRec = wisdom.recommendations[0] ?? null;
  const topOpps = (opportunity.exchange ?? [])
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);
  const topRisks = wisdom.risks.slice(0, 3);

  const actionItems = wisdom.recommendations.slice(0, 4).map((rec) => ({
    id: rec.id,
    title: rec.action || rec.title,
    subtitle: `Owner: ${rec.owner} · ${rec.priority}`,
    priority: rec.priority,
    href: "/exec/actions",
  }));

  const moduleCount = INTELLIGENCE_MODULE_IDS.length;

  return {
    generatedAt: new Date().toISOString(),
    health: {
      widgetId: "home.health.overall",
      title: "Organization Health",
      domains: ["organization-health", "oios-core"],
      dataMode: "model-baseline",
      href: "/exec/health",
      score: round(oios.health.score),
      band: oios.health.band,
      dimensions: Object.entries(oios.health.dimensions).map(([key, score]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        score: round(score as number),
      })),
    },
    brief: {
      widgetId: "home.brief.headline",
      title: "Executive Brief",
      domains: ["wisdom", "executive-decision", "predictive"],
      dataMode: "model-baseline",
      href: "/exec/brief",
      headline: wisdom.brief.headline,
      summary: wisdom.brief.summary,
      outlook: wisdom.brief.outlook,
    },
    alerts: {
      widgetId: "home.alerts.critical",
      title: "Critical alerts",
      domains: ["legal-compliance-risk", "wisdom"],
      dataMode: "model-baseline",
      href: "/exec/risks",
      criticalCount: criticalRisks.length,
      items: criticalRisks.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.mitigation,
        priority: r.severity,
        score: round(r.score),
        href: "/exec/risks",
      })),
    },
    topRecommendation: {
      widgetId: "home.wisdom.top",
      title: "Top recommendation",
      domains: ["wisdom"],
      dataMode: "model-baseline",
      href: "/exec/wisdom",
      item: topRec
        ? {
            id: topRec.id,
            title: topRec.title,
            subtitle: topRec.rationale,
            priority: topRec.priority,
            score: round(topRec.confidenceScore * 100),
            href: "/exec/wisdom",
          }
        : null,
    },
    opportunities: {
      widgetId: "home.opportunity.top3",
      title: "Top opportunities",
      domains: ["opportunity", "funding", "revenue", "innovation"],
      dataMode: "model-baseline",
      href: "/exec/opportunities",
      items: topOpps.map((o) => ({
        id: o.id,
        title: o.title,
        subtitle: o.category,
        score: round(o.score ?? 0),
        href: "/exec/opportunities",
      })),
    },
    risks: {
      widgetId: "home.risk.top3",
      title: "Top risks",
      domains: ["legal-compliance-risk", "wisdom"],
      dataMode: "model-baseline",
      href: "/exec/risks",
      items: topRisks.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.area.replaceAll("_", " "),
        priority: r.severity,
        score: round(r.score),
        href: "/exec/risks",
      })),
    },
    finance: {
      widgetId: "home.finance.spark",
      title: "Financial snapshot",
      domains: ["financial", "revenue", "funding"],
      dataMode: "model-baseline",
      href: "/exec/finance",
      score: round(oios.health.dimensions.financial),
      label: "Financial health",
      detail: `OIOS financial dimension · band ${oios.health.band}`,
    },
    workforce: {
      widgetId: "home.workforce.spark",
      title: "Workforce snapshot",
      domains: ["human-capital"],
      dataMode: "synthetic",
      href: "/exec/workforce",
      score: round(oios.health.dimensions.organizational),
      label: "People posture (proxy)",
      detail: "Sample proxy from OIOS organizational dimension until HRIS sync",
    },
    customer: {
      widgetId: "home.customer.spark",
      title: "Customer / enrollment",
      domains: ["customer"],
      dataMode: "synthetic",
      href: "/exec/customers",
      score: round((oios.health.dimensions.organizational + oios.health.dimensions.execution) / 2),
      label: "Demand posture (proxy)",
      detail: "Sample proxy until CRM / SIS connectors are live",
    },
    actions: {
      widgetId: "home.actions.pending",
      title: "Needs your decision",
      domains: ["executive-decision", "board-governance"],
      dataMode: "model-baseline",
      href: "/exec/actions",
      items: actionItems,
    },
    predictive: {
      widgetId: "home.predictive.outlook",
      title: "Predictive outlook",
      domains: ["predictive"],
      dataMode: "model-baseline",
      href: "/exec/predictive",
      outlook: wisdom.brief.outlook,
      headline: wisdom.forecastDashboard.headline,
      score: round(wisdom.forecastDashboard.score),
    },
    timeline: {
      widgetId: "home.timeline.7d",
      title: "Last 7 days",
      domains: ["institutional-memory"],
      dataMode: "synthetic",
      href: "/exec/timeline",
      items: [
        {
          id: "tl-1",
          title: "Wisdom baseline refreshed",
          subtitle: "Model cycle · no live connector events yet",
        },
        {
          id: "tl-2",
          title: "OIOS health index computed",
          subtitle: `Score ${round(oios.health.score)} (${oios.health.band})`,
        },
        {
          id: "tl-3",
          title: "Opportunity exchange ranked",
          subtitle: `${opportunity.exchange?.length ?? 0} baseline opportunities`,
        },
      ],
    },
    graph: {
      widgetId: "home.graph.status",
      title: "Intelligence graph",
      domains: ["platform"],
      dataMode: "live",
      href: "/exec/graph",
      status: "39-domain pipeline registered",
      moduleCount,
    },
  };
}
