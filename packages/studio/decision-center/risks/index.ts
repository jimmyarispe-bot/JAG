/**
 * Decision Center — Risk Center aggregation + trends.
 */

import type { DecisionEvidenceContext } from "../context";
import { buildDecisionEvidenceContext } from "../context";
import type { RiskCenterView, RiskItem } from "../types";

const g = globalThis as typeof globalThis & {
  __jagStudioDecisionRiskTrend?: { at: string; riskScore: number }[];
};

function riskTrend(): { at: string; riskScore: number }[] {
  if (!g.__jagStudioDecisionRiskTrend) g.__jagStudioDecisionRiskTrend = [];
  return g.__jagStudioDecisionRiskTrend;
}

export function clearDecisionRiskTrend(): void {
  g.__jagStudioDecisionRiskTrend = [];
}

export function buildRiskCenter(
  root?: string,
  ctx?: DecisionEvidenceContext
): RiskCenterView {
  const c = ctx ?? buildDecisionEvidenceContext(root);
  const risks: RiskItem[] = [];

  for (const v of c.architecture.violations.slice(0, 20)) {
    risks.push({
      id: `risk:arch:${v.id}`,
      category: "architecture",
      title: v.message,
      severity:
        v.severity === "Error"
          ? "Error"
          : v.severity === "Warning"
            ? "Warning"
            : "Info",
      evidence: Object.freeze([v.rule, ...v.nodes]),
      trend: "flat",
    });
  }

  if (c.dependencies.riskScore > 40) {
    risks.push({
      id: "risk:dependency:score",
      category: "dependency",
      title: `Dependency risk elevated (${c.dependencies.riskScore})`,
      evidence: Object.freeze([
        `circular=${c.dependencies.circularDependencies.length}`,
        `issues=${c.dependencies.issues.length}`,
      ]),
      severity: c.dependencies.riskScore >= 70 ? "Error" : "Warning",
      trend: "up",
    });
  }

  for (const cycle of c.dependencies.circularDependencies.slice(0, 5)) {
    risks.push({
      id: `risk:dep:cycle:${cycle.join(">")}`,
      category: "dependency",
      title: "Circular dependency",
      severity: "Error",
      evidence: Object.freeze([cycle.join(" → ")]),
      trend: "flat",
    });
  }

  const stalePers = c.pers.filter(
    (p) => p.status === "Open" || p.status === "Accepted"
  );
  if (stalePers.length > 0) {
    risks.push({
      id: "risk:per:open",
      category: "per",
      title: `${stalePers.length} open/accepted PER(s)`,
      severity: stalePers.length >= 10 ? "Warning" : "Info",
      evidence: Object.freeze(stalePers.slice(0, 10).map((p) => p.id)),
      trend: "flat",
    });
  }

  const connectorIssues = c.dependencies.issues.filter((i) =>
    /connector/i.test(i.title + i.detail)
  );
  if (connectorIssues.length > 0) {
    risks.push({
      id: "risk:connector",
      category: "connector",
      title: `${connectorIssues.length} connector-related issue(s)`,
      severity: "Warning",
      evidence: Object.freeze(connectorIssues.slice(0, 5).map((i) => i.title)),
      trend: "flat",
    });
  }

  if (c.coverage.untestedServices.length > 0) {
    risks.push({
      id: "risk:testing:untested",
      category: "testing",
      title: `${c.coverage.untestedServices.length} untested service(s)`,
      severity: c.coverage.untestedServices.length > 20 ? "Error" : "Warning",
      evidence: Object.freeze(c.coverage.untestedServices.slice(0, 15)),
      trend: "flat",
    });
  }

  if (c.coverage.undocumentedApis.length > 0) {
    risks.push({
      id: "risk:api:undoc",
      category: "api",
      title: `${c.coverage.undocumentedApis.length} undocumented API(s)`,
      severity: "Warning",
      evidence: Object.freeze(c.coverage.undocumentedApis.slice(0, 15)),
      trend: "flat",
    });
  }

  const debtProxy =
    c.coverage.untestedServices.length +
    c.coverage.undocumentedApis.length +
    stalePers.length;
  if (debtProxy > 0) {
    risks.push({
      id: "risk:debt",
      category: "technical_debt",
      title: `Technical debt pressure (${debtProxy})`,
      severity: debtProxy > 40 ? "Warning" : "Info",
      evidence: Object.freeze([
        `untested=${c.coverage.untestedServices.length}`,
        `undocApis=${c.coverage.undocumentedApis.length}`,
        `openPers=${stalePers.length}`,
      ]),
      trend: "flat",
    });
  }

  // Stale documentation proxy: docs without recent keyword freshness
  const staleDocs = c.graph.nodes.filter(
    (n) => n.kind === "document" && n.keywords.includes("outdated")
  ).length;
  if (staleDocs > 0 || c.coverage.undocumentedApis.length > 50) {
    risks.push({
      id: "risk:docs:stale",
      category: "documentation",
      title: "Documentation coverage gaps / stale markers",
      severity: "Info",
      evidence: Object.freeze([
        `undocumentedApis=${c.coverage.undocumentedApis.length}`,
        `staleMarkers=${staleDocs}`,
      ]),
      trend: "flat",
    });
  }

  const riskScore = Math.min(
    100,
    risks.reduce(
      (a, r) =>
        a + ({ Info: 1, Warning: 3, Error: 8, Critical: 15 }[r.severity] ?? 1),
      0
    )
  );
  const trend = riskTrend();
  trend.push({ at: new Date().toISOString(), riskScore });
  if (trend.length > 30) trend.splice(0, trend.length - 30);

  const countsByCategory: Record<string, number> = {};
  for (const r of risks) {
    countsByCategory[r.category] = (countsByCategory[r.category] ?? 0) + 1;
  }

  const rank = { Critical: 4, Error: 3, Warning: 2, Info: 1 };
  return {
    generatedAt: new Date().toISOString(),
    risks: Object.freeze(
      [...risks].sort(
        (a, b) =>
          rank[b.severity] - rank[a.severity] || a.id.localeCompare(b.id)
      )
    ),
    countsByCategory: Object.freeze(countsByCategory),
    trends: Object.freeze([...trend]),
  };
}
