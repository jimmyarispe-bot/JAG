import { ensurePlaidSynced } from "@/lib/exec/ensure-plaid";
import { ensureQuickBooksSynced } from "@/lib/exec/ensure-quickbooks";
import { ensureSquareSynced } from "@/lib/exec/ensure-square";
import { plaidDataMode, resolvePlaidFeed } from "@/lib/exec/plaid-feed";
import { resolvePlaidCashReconciliation } from "@/lib/exec/plaid-cash-reconciliation";
import { quickBooksDataMode, resolveQuickBooksFeed } from "@/lib/exec/quickbooks-feed";
import { squareDataMode, resolveSquareFeed } from "@/lib/exec/square-feed";
import { resolveSquareQuickBooksReconciliation } from "@/lib/exec/square-quickbooks-reconciliation";
import { getExecIntelligence } from "@/lib/exec/intelligence";
import { getExecRuntime } from "@/lib/exec/scope";
import type { ExecRiskCategory, ExecRiskViewModel } from "@/lib/exec/view-models";

const ECC_RISK_CATEGORIES: Array<{
  key: ExecRiskCategory;
  label: string;
  domains: string[];
  lcrKey: string | null;
}> = [
  { key: "financial", label: "Financial", domains: ["financial", "revenue", "funding"], lcrKey: "financial" },
  { key: "operational", label: "Operational", domains: ["operations", "systems", "resilience"], lcrKey: "operational" },
  { key: "legal", label: "Legal", domains: ["legal-compliance-risk", "document"], lcrKey: "legal" },
  { key: "compliance", label: "Compliance", domains: ["legal-compliance-risk", "board-governance"], lcrKey: "compliance" },
  { key: "cyber", label: "Cyber", domains: ["systems", "resilience"], lcrKey: "cyber" },
  { key: "reputation", label: "Reputation", domains: ["reputation", "stakeholder", "customer"], lcrKey: "reputation" },
  { key: "economic", label: "Economic", domains: ["economic", "market"], lcrKey: null },
  { key: "political", label: "Political", domains: ["political", "stakeholder"], lcrKey: null },
  { key: "environmental", label: "Environmental", domains: ["environmental", "resilience"], lcrKey: null },
];

/**
 * Risk Center — LCR portfolio; Plaid cash + QB/Square reconciliations enrich financial pressure.
 */
export async function loadExecRisks(): Promise<ExecRiskViewModel> {
  const runtime = await getExecRuntime();
  const orgId = runtime.scope.organizationId;
  const [sqEnsure, qbEnsure, plaidEnsure] = await Promise.all([
    ensureSquareSynced(),
    ensureQuickBooksSynced(),
    ensurePlaidSynced(),
  ]);
  const square = resolveSquareFeed(orgId);
  const qb = resolveQuickBooksFeed(orgId);
  const plaid = resolvePlaidFeed(orgId);
  const sqMode = squareDataMode(square, sqEnsure.freshlySynced);
  const qbMode = quickBooksDataMode(qb, qbEnsure.freshlySynced);
  const plaidMode = plaidDataMode(plaid, plaidEnsure.freshlySynced);
  const recon = resolveSquareQuickBooksReconciliation(orgId);
  const cashRecon = resolvePlaidCashReconciliation(orgId);

  const intelligence = getExecIntelligence();
  const scope = { ...runtime.scope };
  const requestId = `exec-risks-${Date.now()}`;

  const lcr = intelligence.legalComplianceRisk.service.build({
    requestId: `${requestId}-lcr`,
    scope,
  });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
  });

  const suite = lcr.enterpriseRisk;
  const categories = ECC_RISK_CATEGORIES.map((cat) => {
    if (cat.lcrKey && suite.risks[cat.lcrKey as keyof typeof suite.risks]) {
      const records = suite.risks[cat.lcrKey as keyof typeof suite.risks] ?? [];
      let pressure = suite.byCategory[cat.lcrKey as keyof typeof suite.byCategory] ?? 0;
      if (cat.key === "financial" && qb) {
        pressure = Math.max(
          pressure,
          Math.min(
            100,
            40 + qb.cashFlow.overdueReceivables / 1000 + qb.cashFlow.overduePayables / 800
          )
        );
      }
      if (cat.key === "financial" && recon.bothConnected) {
        pressure = Math.max(pressure, recon.riskPressure);
      }
      if (cat.key === "financial" && cashRecon.multiSystem) {
        pressure = Math.max(pressure, cashRecon.riskPressure);
      }
      const cashReconItems =
        cat.key === "financial" && cashRecon.multiSystem
          ? cashRecon.discrepancies.slice(0, 3).map((d) => ({
              id: d.id,
              title: d.title,
              subtitle: d.detail,
              score: Math.round(cashRecon.riskPressure),
              priority:
                d.severity === "critical"
                  ? ("critical" as const)
                  : d.severity === "warning"
                    ? ("high" as const)
                    : ("medium" as const),
            }))
          : [];
      const reconItems =
        cat.key === "financial" && recon.bothConnected
          ? recon.discrepancies.slice(0, 2).map((d) => ({
              id: d.id,
              title: d.title,
              subtitle: d.detail,
              score: Math.round(recon.riskPressure),
              priority:
                d.severity === "critical"
                  ? ("critical" as const)
                  : d.severity === "warning"
                    ? ("high" as const)
                    : ("medium" as const),
            }))
          : [];
      const qbItems =
        cat.key === "financial" &&
        qb &&
        qb.cashFlow.overdueReceivables + qb.cashFlow.overduePayables > 0
          ? [
              {
                id: "qb-overdue-ar-ap",
                title: "QuickBooks overdue AR/AP",
                subtitle: `AR $${qb.cashFlow.overdueReceivables.toLocaleString()} · AP $${qb.cashFlow.overduePayables.toLocaleString()}`,
                score: Math.round(pressure),
                priority:
                  pressure >= 70 ? ("critical" as const) : pressure >= 50 ? ("high" as const) : ("medium" as const),
              },
            ]
          : [];
      return {
        key: cat.key,
        label: cat.label,
        domains:
          cat.key === "financial"
            ? [
                ...cat.domains,
                ...(plaid ? ["plaid"] : []),
                ...(qb ? ["quickbooks"] : []),
                ...(square ? ["square"] : []),
              ]
            : cat.domains,
        pressure: Math.round(pressure * 10) / 10,
        items: [
          ...cashReconItems,
          ...reconItems,
          ...qbItems,
          ...records.slice(0, 5).map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: r.mitigation,
            score: Math.round(r.residualScore ?? r.inherentScore),
            priority:
              (r.residualScore ?? r.inherentScore) >= 70
                ? ("critical" as const)
                : (r.residualScore ?? r.inherentScore) >= 50
                  ? ("high" as const)
                  : ("medium" as const),
          })),
        ].slice(0, 5),
      };
    }

    const proxy = wisdom.risks[0];
    return {
      key: cat.key,
      label: cat.label,
      domains: cat.domains,
      pressure: Math.round((100 - (wisdom.health.overallScore ?? 70)) * 0.6),
      items: [
        {
          id: `synth-${cat.key}`,
          title: `${cat.label} risk monitoring (sample)`,
          subtitle: `Placeholder until ${cat.domains[0]} connector soft-read is wired for ECC`,
          priority: "monitor" as const,
          score: Math.round(proxy?.score ?? 35),
        },
      ],
    };
  });

  const prioritized = [
    ...cashRecon.discrepancies.map((d) => ({
      id: d.id,
      title: d.title,
      subtitle: `Plaid cash · ${d.kind}`,
      priority:
        d.severity === "critical"
          ? ("critical" as const)
          : d.severity === "warning"
            ? ("high" as const)
            : ("medium" as const),
      score: Math.round(cashRecon.riskPressure),
    })),
    ...recon.discrepancies.map((d) => ({
      id: d.id,
      title: d.title,
      subtitle: `Square↔QB · ${d.kind}`,
      priority:
        d.severity === "critical"
          ? ("critical" as const)
          : d.severity === "warning"
            ? ("high" as const)
            : ("medium" as const),
      score: Math.round(recon.riskPressure),
    })),
    ...lcr.risks.slice(0, 8).map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: `${r.category} · ${r.mitigation}`,
      priority: r.severity,
      score: Math.round(r.score),
    })),
    ...wisdom.risks.slice(0, 3).map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: `Wisdom · ${r.area}`,
      priority: r.severity,
      score: Math.round(r.score),
    })),
  ].slice(0, 12);

  return {
    generatedAt: lcr.generatedAt,
    categories,
    prioritized,
    dataMode: plaid ? plaidMode : qb ? qbMode : square ? sqMode : "model-baseline",
  };
}
