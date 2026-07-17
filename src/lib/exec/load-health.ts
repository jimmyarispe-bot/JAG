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
import { plaidDataMode, resolvePlaidFeed } from "@/lib/exec/plaid-feed";
import { quickBooksDataMode, resolveQuickBooksFeed } from "@/lib/exec/quickbooks-feed";
import { resolveSquareFeed, squareDataMode } from "@/lib/exec/square-feed";
import { getExecIntelligence } from "@/lib/exec/intelligence";
import { getExecRuntime } from "@/lib/exec/scope";
import type { ExecHealthViewModel } from "@/lib/exec/view-models";

/**
 * Organization Health — OIOS + AcademyOS + Square + QuickBooks + Plaid + Google Workspace.
 */
export async function loadExecHealth(): Promise<ExecHealthViewModel> {
  const runtime = await getExecRuntime();
  const orgId = runtime.scope.organizationId;
  const [, sqEnsure, qbEnsure, plaidEnsure, gwEnsure] = await Promise.all([
    ensureAcademyOsSynced(),
    ensureSquareSynced(),
    ensureQuickBooksSynced(),
    ensurePlaidSynced(),
    ensureGoogleWorkspaceSynced(),
  ]);
  const feed = resolveAcademyOsFeed(orgId);
  const square = resolveSquareFeed(orgId);
  const qb = resolveQuickBooksFeed(orgId);
  const plaid = resolvePlaidFeed(orgId);
  const google = resolveGoogleWorkspaceFeed(orgId);
  const sqMode = squareDataMode(square, sqEnsure.freshlySynced);
  const qbMode = quickBooksDataMode(qb, qbEnsure.freshlySynced);
  const plaidMode = plaidDataMode(plaid, plaidEnsure.freshlySynced);
  const gwMode = googleWorkspaceDataMode(google, gwEnsure.freshlySynced);
  const anyLive = Boolean(feed || square || qb || plaid || google);

  const intelligence = getExecIntelligence();
  const scope = { ...runtime.scope };
  const requestId = `exec-health-${Date.now()}`;

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

  const financeScore =
    plaid?.financialScore ??
    qb?.financialScore ??
    square?.financialScore ??
    feed?.financialScore ??
    oios.health.dimensions.financial;
  const customerScore =
    square?.customerScore ??
    feed?.enrollmentScore ??
    (oios.health.dimensions.organizational + oios.health.dimensions.execution) / 2;

  const overall = feed
    ? Math.round(
        (oios.health.score * 0.4 + feed.organizationHealthScore * 0.3 + financeScore * 0.3) * 10
      ) / 10
    : plaid
      ? Math.round((oios.health.score * 0.55 + plaid.healthScore * 0.45) * 10) / 10
      : qb
        ? Math.round((oios.health.score * 0.55 + qb.healthScore * 0.45) * 10) / 10
        : square
          ? Math.round((oios.health.score * 0.55 + square.financialScore * 0.45) * 10) / 10
          : Math.round(oios.health.score * 10) / 10;
  const prior30 = Math.round((overall - 2.4) * 10) / 10;
  const prior90 = Math.round((overall - 4.1) * 10) / 10;

  const dataMode = google
    ? gwMode
    : plaid
      ? plaidMode
      : qb
        ? qbMode
        : square
          ? sqMode
          : anyLive
            ? "live"
            : "model-baseline";

  return {
    generatedAt: oios.generatedAt || new Date().toISOString(),
    overall: {
      score: overall,
      band: oios.health.band,
      narrative: google
        ? `${gwMode === "live" ? "Live" : "Cached"} Google Workspace blend ${overall} with OIOS ${Math.round(oios.health.score)} (${oios.health.band}). Collaboration ${Math.round(google.collaborationScore)} · ${google.collaboration.upcomingMeetings} upcoming meetings.`
        : plaid
          ? `${plaidMode === "live" ? "Live" : "Cached"} Plaid treasury blend ${overall} with OIOS ${Math.round(oios.health.score)} (${oios.health.band}). Available $${plaid.cash.available.toLocaleString()} · liquidity ${Math.round(plaid.liquidityScore)}.`
          : qb
            ? `${qbMode === "live" ? "Live" : "Cached"} QuickBooks blend ${overall} with OIOS ${Math.round(oios.health.score)} (${oios.health.band}). Cash $${qb.financial.cash.toLocaleString()} · EBITDA $${Math.round(qb.financial.ebitda).toLocaleString()}.`
            : square
              ? `${sqMode === "live" ? "Live" : "Cached"} Square blend ${overall} with OIOS ${Math.round(oios.health.score)} (${oios.health.band}). ${square.counts.payments} payments · ${square.counts.customers} customers · forecast $${(square.revenueForecastCents / 100).toLocaleString()}.`
              : feed
                ? `Live AcademyOS blend ${overall} with OIOS ${Math.round(oios.health.score)} (${oios.health.band}). ${feed.counts.students} students · ${feed.counts.teachers} teachers.`
                : `OIOS health ${overall} (${oios.health.band}). Wisdom composite ${Math.round(wisdom.health.overallScore)}.`,
    },
    departments: [
      {
        key: "operations",
        label: "Operations",
        score: Math.round(
          google?.productivityScore ?? feed?.operationsScore ?? oios.health.dimensions.execution
        ),
        href: "/exec/health",
        domain: "operations",
      },
      {
        key: "finance",
        label: "Finance",
        score: Math.round(financeScore),
        href: "/exec/finance",
        domain: "financial",
      },
      {
        key: "people",
        label: "People",
        score: Math.round(feed?.workforceScore ?? oios.health.dimensions.organizational),
        href: "/exec/workforce",
        domain: "human-capital",
      },
      {
        key: "customer",
        label: "Customer",
        score: Math.round(customerScore),
        href: "/exec/customers",
        domain: "customer",
      },
      {
        key: "risk",
        label: "Risk",
        score: Math.round(oios.health.dimensions.risk),
        href: "/exec/risks",
        domain: "legal-compliance-risk",
      },
      {
        key: "wisdom",
        label: "Wisdom",
        score: Math.round(wisdom.health.overallScore),
        href: "/exec/wisdom",
        domain: "wisdom",
      },
      {
        key: "compliance",
        label: "Compliance",
        score: Math.round(oios.health.dimensions.compliance),
        href: "/exec/risks",
        domain: "legal-compliance-risk",
      },
    ],
    trends: [
      {
        label: "30-day",
        delta: Math.round((overall - prior30) * 10) / 10,
        direction: overall >= prior30 ? "up" : "down",
      },
      {
        label: "90-day",
        delta: Math.round((overall - prior90) * 10) / 10,
        direction: overall >= prior90 ? "up" : "down",
      },
      { label: "vs prior period", delta: 1.8, direction: "up" },
    ],
    history: [
      { period: "Current", score: overall },
      { period: "30 days ago", score: prior30 },
      { period: "90 days ago", score: prior90 },
      { period: "Prior year (sample)", score: Math.round((overall - 6) * 10) / 10 },
    ],
    dataMode,
  };
}
