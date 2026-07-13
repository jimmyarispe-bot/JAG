import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
import type { ExecRiskCategory, ExecRiskViewModel } from "@/lib/exec/view-models";

const ECC_RISK_CATEGORIES: Array<{
  key: ExecRiskCategory;
  label: string;
  domains: string[];
  /** LCR category key when present; null = synthetic placeholder until domain soft-read is wired for ECC. */
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
 * Risk Center — primary portfolio from Legal/Compliance/Risk Intelligence.
 * Economic / political / environmental use labeled synthetic placeholders
 * (those domain builds are heavy; soft-read wiring deferred without changing packages).
 */
export function loadExecRisks(): ExecRiskViewModel {
  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
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
      const pressure = suite.byCategory[cat.lcrKey as keyof typeof suite.byCategory] ?? 0;
      return {
        key: cat.key,
        label: cat.label,
        domains: cat.domains,
        pressure: Math.round(pressure * 10) / 10,
        items: records.slice(0, 5).map((r) => ({
          id: r.id,
          title: r.title,
          subtitle: r.mitigation,
          score: Math.round(r.residualScore ?? r.inherentScore),
          priority:
            (r.residualScore ?? r.inherentScore) >= 70
              ? "critical"
              : (r.residualScore ?? r.inherentScore) >= 50
                ? "high"
                : "medium",
        })),
      };
    }

    // Synthetic category placeholders for ECC taxonomy gaps
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
          priority: "monitor",
          score: Math.round(proxy?.score ?? 35),
        },
      ],
    };
  });

  const prioritized = [
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
    dataMode: "model-baseline",
  };
}
