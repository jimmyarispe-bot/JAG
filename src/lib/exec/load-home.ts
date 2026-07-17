import { INTELLIGENCE_MODULE_IDS } from "@/lib/platform/intelligence/infrastructure/types";
import { resolveAcademyOsFeed } from "@/lib/exec/academyos-feed";
import { ensureAcademyOsSynced } from "@/lib/exec/ensure-academyos";
import { ensureGoogleWorkspaceSynced } from "@/lib/exec/ensure-google-workspace";
import { ensurePlaidSynced } from "@/lib/exec/ensure-plaid";
import { ensureQuickBooksSynced } from "@/lib/exec/ensure-quickbooks";
import { ensureSquareSynced } from "@/lib/exec/ensure-square";
import {
  googleWorkspaceDataMode,
  resolveGoogleWorkspaceFeed,
} from "@/lib/exec/google-workspace-feed";
import { resolveGoogleWorkspaceCorrelation } from "@/lib/exec/google-workspace-correlation";
import { plaidDataMode, resolvePlaidFeed } from "@/lib/exec/plaid-feed";
import { resolvePlaidCashReconciliation } from "@/lib/exec/plaid-cash-reconciliation";
import { quickBooksDataMode, resolveQuickBooksFeed } from "@/lib/exec/quickbooks-feed";
import { resolveSquareFeed, squareDataMode } from "@/lib/exec/square-feed";
import { resolveSquareQuickBooksReconciliation } from "@/lib/exec/square-quickbooks-reconciliation";
import { connectorDataMode } from "@/lib/exec/data-mode";
import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
import type { ExecHomeViewModel } from "@/lib/exec/view-models";

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function moneyDollars(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/**
 * Home dashboard — AcademyOS, Square, QuickBooks, Plaid, Google Workspace when synced.
 */
export async function loadExecHome(): Promise<ExecHomeViewModel> {
  const [, sqEnsure, qbEnsure, plaidEnsure, gwEnsure] = await Promise.all([
    ensureAcademyOsSynced(),
    ensureSquareSynced(),
    ensureQuickBooksSynced(),
    ensurePlaidSynced(),
    ensureGoogleWorkspaceSynced(),
  ]);
  const feed = resolveAcademyOsFeed(DEFAULT_EXEC_SCOPE.organizationId);
  const square = resolveSquareFeed(DEFAULT_EXEC_SCOPE.organizationId);
  const qb = resolveQuickBooksFeed(DEFAULT_EXEC_SCOPE.organizationId);
  const plaid = resolvePlaidFeed(DEFAULT_EXEC_SCOPE.organizationId);
  const google = resolveGoogleWorkspaceFeed(DEFAULT_EXEC_SCOPE.organizationId);
  const sqMode = squareDataMode(square, sqEnsure.freshlySynced);
  const qbMode = quickBooksDataMode(qb, qbEnsure.freshlySynced);
  const plaidMode = plaidDataMode(plaid, plaidEnsure.freshlySynced);
  const gwMode = googleWorkspaceDataMode(google, gwEnsure.freshlySynced);
  const recon = resolveSquareQuickBooksReconciliation();
  const cashRecon = resolvePlaidCashReconciliation();
  const gwCorr = resolveGoogleWorkspaceCorrelation();
  const anyConnector = Boolean(feed || square || qb || plaid || google);

  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
  const requestId = `exec-home-${Date.now()}`;

  const oios = intelligence.oios.service.build({ requestId: `${requestId}-oios`, scope });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
    oiosResult: oios,
    humanCapitalResult: feed?.softLights.humanCapital,
    operationsResult: feed?.softLights.operations,
    stakeholderResult: feed
      ? {
          healthScore: { value: feed.enrollmentScore },
          engagementScore: { value: feed.enrollmentScore },
        }
      : square
        ? {
            healthScore: { value: square.customerScore },
            engagementScore: { value: square.customerScore },
          }
        : undefined,
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
  const financeScore = plaid
    ? plaid.financialScore
    : qb
      ? qb.financialScore
      : square
        ? square.financialScore
        : feed
          ? feed.financialScore
          : round(oios.health.dimensions.financial);

  const healthScore = feed
    ? round(
        oios.health.score * 0.4 +
          feed.organizationHealthScore * 0.3 +
          financeScore * 0.3
      )
    : plaid
      ? round(oios.health.score * 0.55 + plaid.healthScore * 0.45)
      : qb
        ? round(oios.health.score * 0.55 + qb.healthScore * 0.45)
        : square
          ? round(oios.health.score * 0.6 + square.financialScore * 0.4)
          : round(oios.health.score);

  const customerScore = square
    ? round(
        square.customerScore * 0.55 +
          (feed?.enrollmentScore ?? square.customerScore) * 0.45
      )
    : feed
      ? feed.enrollmentScore
      : round((oios.health.dimensions.organizational + oios.health.dimensions.execution) / 2);

  const timelineItems = [
    ...(google?.timeline ?? []),
    ...(plaid?.timeline ?? []),
    ...(qb?.timeline ?? []),
    ...(square?.timeline ?? []),
    ...(feed?.timeline ?? []),
    ...gwCorr.links.slice(0, 2).map((l) => ({
      id: l.id,
      title: l.title,
      subtitle: l.detail,
      at: l.at,
    })),
    ...cashRecon.discrepancies.slice(0, 1).map((d) => ({
      id: d.id,
      title: d.title,
      subtitle: d.detail,
      at: cashRecon.comparedAt,
    })),
    ...recon.discrepancies.slice(0, 1).map((d) => ({
      id: d.id,
      title: d.title,
      subtitle: d.detail,
      at: recon.comparedAt,
    })),
  ]
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `${t.subtitle} · ${new Date(t.at).toLocaleString()}`,
    }));

  const financeMode = plaid
    ? plaidMode
    : qb
      ? qbMode
      : square
        ? sqMode
        : connectorDataMode({ hasFeed: Boolean(feed), freshlySynced: true });

  const commerceMode = square ? sqMode : feed ? "live" : qb ? qbMode : plaid ? plaidMode : "synthetic";
  const briefMode = google
    ? gwMode
    : plaid
      ? plaidMode
      : qb
        ? qbMode
        : square
          ? sqMode
          : anyConnector
            ? "live"
            : "model-baseline";

  const financeDetail = plaid
    ? `${plaidMode === "live" ? "Live" : "Cached"} Plaid · available ${moneyDollars(plaid.cash.available)} · current ${moneyDollars(plaid.cash.current)} · forecast ${moneyDollars(plaid.cash.cashForecast30d)}`
    : qb
      ? `${qbMode === "live" ? "Live" : "Cached"} QB · cash ${moneyDollars(qb.financial.cash)} · EBITDA ${moneyDollars(qb.financial.ebitda)} · budget var ${round(qb.budgetVarianceScore)}`
      : square
        ? `${sqMode === "live" ? "Live" : "Cached"} Square · ${money(square.payments.volumeCents24h)} today · ${money(square.cashFlow.depositsPendingCents)} pending`
        : feed
          ? `Live · net ${feed.financial.net?.toLocaleString() ?? "—"} · cash ${feed.financial.cash?.toLocaleString() ?? "—"}`
          : `OIOS financial dimension · band ${oios.health.band}`;

  const reconSuffix =
    cashRecon.multiSystem && cashRecon.discrepancies.length > 0
      ? ` · ${cashRecon.discrepancies.length} cash discrepancy(ies)`
      : recon.bothConnected && recon.discrepancies.length > 0
        ? ` · ${recon.discrepancies.length} Square↔QB discrepancy(ies)`
        : "";

  return {
    generatedAt: new Date().toISOString(),
    health: {
      widgetId: "home.health.overall",
      title: "Organization Health",
      domains: [
        "organization-health",
        "oios-core",
        ...(feed ? ["academyos"] : []),
        ...(square ? ["square"] : []),
        ...(qb ? ["quickbooks"] : []),
        ...(plaid ? ["plaid"] : []),
      ],
      dataMode: briefMode,
      href: "/exec/health",
      score: healthScore,
      band: oios.health.band,
      dimensions: Object.entries(oios.health.dimensions).map(([key, score]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        score: round(
          key === "financial"
            ? financeScore
            : feed && key === "execution"
              ? feed.operationsScore
              : feed && key === "organizational"
                ? feed.workforceScore
                : (score as number)
        ),
      })),
    },
    brief: {
      widgetId: "home.brief.headline",
      title: "Executive Brief",
      domains: [
        "wisdom",
        "executive-decision",
        "predictive",
        ...(feed ? ["academyos"] : []),
        ...(square ? ["square"] : []),
        ...(qb ? ["quickbooks"] : []),
        ...(plaid ? ["plaid"] : []),
        ...(google ? ["google-workspace"] : []),
      ],
      dataMode: briefMode,
      href: "/exec/brief",
      headline: google
        ? `Workspace: ${google.collaboration.upcomingMeetings} meetings · ${google.counts.unread} unread · ${google.counts.tasksOpen} open tasks`
        : plaid
          ? `Treasury: available ${moneyDollars(plaid.cash.available)} · liquidity ${round(plaid.liquidityScore)}`
          : qb
            ? `QuickBooks: cash ${moneyDollars(qb.financial.cash)} · EBITDA ${moneyDollars(qb.financial.ebitda)}`
            : square
              ? `Square sales ${money(square.payments.volumeCents24h)} today · health ${healthScore}`
              : feed
                ? `AcademyOS ops: ${feed.counts.students} students · health ${healthScore}`
                : wisdom.brief.headline,
      summary:
        gwCorr.summaryBullets[0] ??
        cashRecon.summaryBullets[0] ??
        recon.summaryBullets[0] ??
        google?.briefBullets[0] ??
        plaid?.briefBullets[0] ??
        qb?.briefBullets[0] ??
        square?.briefBullets[0] ??
        feed?.briefBullets[0] ??
        wisdom.brief.summary,
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
      domains: ["wisdom", ...(qb ? ["quickbooks"] : [])],
      dataMode: qb ? qbMode : "model-baseline",
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
      domains: [
        "opportunity",
        "funding",
        "revenue",
        "innovation",
        ...(qb ? ["quickbooks"] : []),
        ...(square ? ["square"] : []),
      ],
      dataMode: qb ? qbMode : square ? sqMode : "model-baseline",
      href: "/exec/opportunities",
      items: topOpps.map((o) => ({
        id: o.id,
        title: o.title,
        subtitle: qb
          ? `${o.category} · QB revenue ${moneyDollars(qb.financial.revenueActual)}`
          : square
            ? `${o.category} · Square revenue ${money(square.payments.volumeCents7d)}`
            : o.category,
        score: round(o.score ?? 0),
        href: "/exec/opportunities",
      })),
    },
    risks: {
      widgetId: "home.risk.top3",
      title: "Top risks",
      domains: [
        "legal-compliance-risk",
        "wisdom",
        ...(qb ? ["quickbooks"] : []),
        ...(square ? ["square"] : []),
        ...(plaid ? ["plaid"] : []),
      ],
      dataMode:
        cashRecon.multiSystem && cashRecon.discrepancies.length > 0
          ? plaidMode
          : recon.bothConnected && recon.discrepancies.length > 0
            ? qbMode
            : qb && qb.cashFlow.overdueReceivables > 0
              ? qbMode
              : "model-baseline",
      href: "/exec/risks",
      items: [
        ...cashRecon.discrepancies.slice(0, 2).map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: d.detail,
          priority: d.severity === "critical" ? ("critical" as const) : ("high" as const),
          score: round(cashRecon.riskPressure),
          href: "/exec/risks",
        })),
        ...recon.discrepancies.slice(0, 1).map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: d.detail,
          priority: d.severity === "critical" ? ("critical" as const) : ("high" as const),
          score: round(recon.riskPressure),
          href: "/exec/risks",
        })),
        ...topRisks.map((r) => ({
          id: r.id,
          title: r.title,
          subtitle: r.area.replaceAll("_", " "),
          priority: r.severity,
          score: round(r.score),
          href: "/exec/risks",
        })),
      ].slice(0, 3),
    },
    finance: {
      widgetId: "home.finance.spark",
      title: "Financial snapshot",
      domains: [
        "financial",
        "revenue",
        "funding",
        ...(plaid ? ["plaid"] : qb ? ["quickbooks"] : square ? ["square"] : feed ? ["academyos"] : []),
      ],
      dataMode: financeMode,
      href: "/exec/finance",
      score: financeScore,
      label: plaid
        ? "Plaid treasury / cash position"
        : qb
          ? "QuickBooks financial overview"
          : square
            ? "Square payment activity"
            : feed
              ? "AcademyOS financial summary"
              : "Financial health",
      detail: `${financeDetail}${reconSuffix}`,
    },
    workforce: {
      widgetId: "home.workforce.spark",
      title: "Workforce snapshot",
      domains: ["human-capital", ...(feed ? ["academyos"] : [])],
      dataMode: feed ? "live" : "synthetic",
      href: "/exec/workforce",
      score: feed ? feed.workforceScore : round(oios.health.dimensions.organizational),
      label: feed
        ? `${feed.counts.teachers} teachers · ${feed.counts.employees} staff`
        : "People posture (proxy)",
      detail: feed
        ? `Live AcademyOS HRIS · synced ${new Date(feed.syncedAt).toLocaleString()}`
        : "Sample proxy from OIOS organizational dimension until HRIS sync",
    },
    customer: {
      widgetId: "home.customer.spark",
      title: "Customer / enrollment",
      domains: [
        "customer",
        ...(square ? ["square"] : []),
        ...(feed ? ["academyos"] : []),
        ...(qb ? ["quickbooks"] : []),
      ],
      dataMode: commerceMode,
      href: "/exec/customers",
      score: customerScore,
      label: square
        ? `${square.customers.count} Square customers · avg LTV ${money(square.customers.avgLifetimeValueCents)}`
        : feed
          ? `${feed.counts.students} students · ${feed.counts.enrollments} enrollments`
          : qb
            ? `${qb.counts.customers} QB customers · AR ${moneyDollars(qb.financial.ar)}`
            : "Demand posture (proxy)",
      detail: square
        ? `${sqMode === "live" ? "Live" : "Cached"} Square · ${square.payments.count24h} payments today · top ${square.topProducts[0]?.name ?? "catalog"}`
        : feed
          ? `Live AcademyOS SIS · ${feed.counts.campuses} campuses`
          : qb
            ? `${qbMode === "live" ? "Live" : "Cached"} QuickBooks AR aging`
            : "Sample proxy until CRM / SIS connectors are live",
    },
    actions: {
      widgetId: "home.actions.pending",
      title: "Needs your decision",
      domains: [
        "executive-decision",
        "board-governance",
        ...(google ? ["google-workspace"] : []),
      ],
      dataMode: google ? gwMode : "model-baseline",
      href: "/exec/actions",
      items:
        google && google.upcomingDecisions.length > 0
          ? google.upcomingDecisions.slice(0, 4).map((d) => ({
              id: d.id,
              title: d.title,
              subtitle: `Due ${new Date(d.dueAt).toLocaleString()} · ${d.source}`,
              priority: "high",
              href: "/exec/actions",
            }))
          : actionItems,
    },
    predictive: {
      widgetId: "home.predictive.outlook",
      title: "Predictive outlook",
      domains: [
        "predictive",
        ...(google ? ["google-workspace"] : []),
        ...(plaid ? ["plaid"] : []),
        ...(qb ? ["quickbooks"] : []),
        ...(square ? ["square"] : []),
      ],
      dataMode: google ? gwMode : plaid ? plaidMode : qb ? qbMode : square ? sqMode : "model-baseline",
      href: "/exec/predictive",
      outlook: wisdom.brief.outlook,
      headline: google
        ? `Meeting load ${google.collaboration.meetingLoadMinutes7d} min · ${google.collaboration.schedulingConflicts} conflict(s) · next ${google.executiveCalendar[0]?.title ?? "—"}`
        : plaid
          ? `Cash forecast ${moneyDollars(plaid.cash.cashForecast30d)} · burn ${moneyDollars(plaid.cash.burnRateMonthly)}`
          : qb
            ? `QB forecast · EBITDA ${moneyDollars(qb.financial.ebitda)} · predictive ${round(qb.predictiveScore)}`
            : square
              ? `Square forecast ${money(square.revenueForecastCents)} · MRR ${money(square.subscriptions.mrrCents)}`
              : wisdom.forecastDashboard.headline,
      score: google
        ? round(google.executiveScore)
        : plaid
          ? round(plaid.predictiveScore)
          : qb
            ? round(qb.predictiveScore)
            : square
              ? round(square.predictiveScore)
              : round(wisdom.forecastDashboard.score),
    },
    timeline: {
      widgetId: "home.timeline.7d",
      title: "Last 7 days",
      domains: [
        ...(google ? ["google-workspace"] : []),
        ...(plaid ? ["plaid"] : []),
        ...(qb ? ["quickbooks"] : []),
        ...(square ? ["square"] : []),
        ...(feed ? ["academyos"] : []),
        "institutional-memory",
      ],
      dataMode: google
        ? gwMode
        : plaid
          ? plaidMode
          : qb
            ? qbMode
            : square
              ? sqMode
              : anyConnector
                ? "live"
                : "synthetic",
      href: "/exec/timeline",
      items:
        timelineItems.length > 0
          ? timelineItems
          : [
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
