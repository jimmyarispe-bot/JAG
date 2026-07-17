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
import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
import type { ExecBriefViewModel } from "@/lib/exec/view-models";

/**
 * Executive Brief — Wisdom primary, enriched with Workspace / Plaid / QB / Square / AcademyOS.
 */
export async function loadExecBrief(): Promise<ExecBriefViewModel> {
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
  const anyLive = Boolean(feed || square || qb || plaid || google);

  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
  const requestId = `exec-brief-${Date.now()}`;

  const oios = intelligence.oios.service.build({ requestId: `${requestId}-oios`, scope });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
    oiosResult: oios,
    humanCapitalResult: feed?.softLights.humanCapital,
    operationsResult: feed?.softLights.operations ?? google?.softLights.operations,
    stakeholderResult: feed
      ? {
          healthScore: { value: feed.enrollmentScore },
          engagementScore: { value: feed.enrollmentScore },
        }
      : google
        ? {
            healthScore: { value: google.collaborationScore },
            engagementScore: { value: google.collaborationScore },
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

  const liveBullets = [
    ...gwCorr.summaryBullets.slice(0, 2),
    ...(google?.briefBullets.slice(0, 2) ?? []),
    ...cashRecon.summaryBullets.slice(0, 1),
    ...recon.summaryBullets.slice(0, 1),
    ...(plaid?.briefBullets.slice(0, 1) ?? []),
    ...(qb?.briefBullets.slice(0, 1) ?? []),
    ...(square?.briefBullets.slice(0, 1) ?? []),
    ...(feed?.briefBullets.slice(0, 1) ?? []),
  ];

  const whatHappened = (
    liveBullets.length > 0
      ? [
          ...liveBullets,
          `Organization health index at ${Math.round(oios.health.score)} (${oios.health.band}).`,
          `Wisdom outlook: ${wisdom.brief.outlook}.`,
        ]
      : [
          wisdom.brief.summary,
          `Organization health index at ${Math.round(oios.health.score)} (${oios.health.band}).`,
          `Wisdom outlook: ${wisdom.brief.outlook}.`,
          ...wisdom.dashboard.topRisks.slice(0, 2).map((r) => `Risk signal: ${r}`),
        ]
  ).slice(0, 5);

  const whyItMatters = [
    wisdom.brief.judgment.why,
    wisdom.brief.judgment.whyNow,
    cashRecon.multiSystem && cashRecon.discrepancies.length > 0
      ? `Cash reconciliation found ${cashRecon.discrepancies.length} discrepancy(ies) across Plaid / Square / QuickBooks.`
      : gwCorr.links.length > 0
        ? `Workspace correlated ${gwCorr.links.length} calendar/task signal(s) with financial and school systems.`
        : recon.bothConnected && recon.discrepancies.length > 0
          ? `Square↔QuickBooks reconciliation found ${recon.discrepancies.length} discrepancy(ies) requiring finance review.`
          : google
            ? `Meeting load ${google.collaboration.meetingLoadMinutes7d} min · ${google.counts.unread} unread · ${google.collaboration.schedulingConflicts} scheduling conflict(s) tomorrow.`
            : plaid
              ? `Plaid available cash $${plaid.cash.available.toLocaleString()} · working capital $${Math.round(plaid.cash.workingCapital).toLocaleString()} · 30d forecast $${Math.round(plaid.cash.cashForecast30d).toLocaleString()}.`
              : qb
                ? `QuickBooks cash $${qb.financial.cash.toLocaleString()} · overdue AR $${qb.cashFlow.overdueReceivables.toLocaleString()} · overdue AP $${qb.cashFlow.overduePayables.toLocaleString()}.`
                : square
                  ? `Square cash pending $${(square.cashFlow.depositsPendingCents / 100).toLocaleString()} and overdue invoices $${(square.cashFlow.overdueInvoicesCents / 100).toLocaleString()} affect near-term liquidity.`
                  : feed
                    ? `AcademyOS enrollment ${feed.counts.students} and workforce ${feed.counts.teachers + feed.counts.employees} shape near-term capacity.`
                    : `Health dimensions — financial ${Math.round(oios.health.dimensions.financial)}, execution ${Math.round(oios.health.dimensions.execution)}.`,
    wisdom.brief.lenses.longTermImpact,
  ].slice(0, 4);

  const confidence = wisdom.confidence ?? {
    value: wisdom.baseline.confidenceLevel / 100,
    level: "medium",
    factors: [],
  };

  return {
    generatedAt: wisdom.brief.generatedAt || new Date().toISOString(),
    headline: google
      ? `Workspace brief: ${google.collaboration.upcomingMeetings} meetings · ${google.counts.tasksOpen} decisions · board packet ready`
      : plaid
        ? `Treasury brief: available $${plaid.cash.available.toLocaleString()} · liquidity ${Math.round(plaid.liquidityScore)}`
        : qb
          ? `QuickBooks brief: cash $${qb.financial.cash.toLocaleString()} · EBITDA $${Math.round(qb.financial.ebitda).toLocaleString()}`
          : square
            ? `Square morning brief: $${(square.payments.volumeCents24h / 100).toLocaleString()} today · ${square.counts.customers} customers`
            : feed
              ? `AcademyOS morning brief: ${feed.counts.students} students across ${feed.counts.campuses} campuses`
              : wisdom.brief.headline,
    whatHappened,
    whyItMatters,
    recommendedActions: wisdom.recommendations.slice(0, 5).map((rec) => ({
      id: rec.id,
      title: rec.action || rec.title,
      subtitle: rec.rationale,
      priority: rec.priority,
      score: Math.round(rec.confidenceScore * 100),
      href: "/exec/actions",
    })),
    risks: [
      ...cashRecon.discrepancies.slice(0, 2).map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.detail,
        priority:
          d.severity === "critical"
            ? ("critical" as const)
            : d.severity === "warning"
              ? ("high" as const)
              : ("medium" as const),
        score: Math.round(cashRecon.riskPressure),
        href: "/exec/risks",
      })),
      ...recon.discrepancies.slice(0, 1).map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.detail,
        priority:
          d.severity === "critical"
            ? ("critical" as const)
            : d.severity === "warning"
              ? ("high" as const)
              : ("medium" as const),
        score: Math.round(recon.riskPressure),
        href: "/exec/risks",
      })),
      ...wisdom.risks.slice(0, 3).map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.mitigation,
        priority: r.severity,
        score: Math.round(r.score),
        href: "/exec/risks",
      })),
    ].slice(0, 3),
    opportunities: (opportunity.exchange ?? []).slice(0, 3).map((o) => ({
      id: o.id,
      title: o.title,
      subtitle: o.category.replaceAll("_", " "),
      priority: o.priority,
      score: Math.round(o.score),
      href: "/exec/opportunities",
    })),
    confidence: {
      value: Math.round((confidence.value <= 1 ? confidence.value * 100 : confidence.value) * 10) / 10,
      level: String(confidence.level),
      factors: (confidence.factors ?? []).slice(0, 6).map((f) => ({
        label: f.label,
        contribution: f.contribution,
      })),
    },
    evidence: [
      ...(gwCorr.googleConnected
        ? [`correlation:google-workspace:${gwCorr.correlatedAt}`, ...gwCorr.links.map((l) => l.id)]
        : []),
      ...(cashRecon.multiSystem
        ? [`reconciliation:plaid-cash:${cashRecon.comparedAt}`, ...cashRecon.discrepancies.map((d) => d.id)]
        : []),
      ...(recon.bothConnected
        ? [`reconciliation:square-qb:${recon.comparedAt}`, ...recon.discrepancies.map((d) => d.id)]
        : []),
      ...(google
        ? [`google-workspace:sync:${google.syncedAt}`, `google-workspace:org:${google.organizationId}`]
        : []),
      ...(plaid ? [`plaid:sync:${plaid.syncedAt}`, `plaid:org:${plaid.organizationId}`] : []),
      ...(qb ? [`quickbooks:sync:${qb.syncedAt}`, `quickbooks:org:${qb.organizationId}`] : []),
      ...(square ? [`square:sync:${square.syncedAt}`, `square:org:${square.organizationId}`] : []),
      ...(feed ? [`academyos:sync:${feed.syncedAt}`, `academyos:org:${feed.organizationId}`] : []),
      ...wisdom.recommendations.flatMap((r) => r.evidenceRefs).slice(0, 6),
      wisdom.brief.judgment.evidence,
    ].filter(Boolean),
    relatedDomains: [
      "wisdom",
      "oios-core",
      "opportunity",
      "executive-decision",
      "predictive",
      "collective",
      ...(feed ? ["academyos", "customer", "human-capital", "operations", "financial"] : []),
      ...(square ? ["square", "financial", "customer", "revenue"] : []),
      ...(qb ? ["quickbooks", "financial", "revenue", "systems", "resilience"] : []),
      ...(plaid ? ["plaid", "financial", "resilience", "predictive"] : []),
      ...(google ? ["google-workspace", "operations", "stakeholder", "executive-decision"] : []),
    ],
    judgment: {
      whatLeadershipShouldDo: wisdom.brief.judgment.whatLeadershipShouldDo,
      why: wisdom.brief.judgment.why,
      whyNow: wisdom.brief.judgment.whyNow,
      expectedOutcome: wisdom.brief.judgment.expectedOutcome,
    },
    dataMode: google
      ? gwMode
      : plaid
        ? plaidMode
        : qb
          ? qbMode
          : square
            ? sqMode
            : anyLive
              ? "live"
              : "model-baseline",
  };
}
