import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
import type { ExecHealthViewModel } from "@/lib/exec/view-models";

/**
 * Organization Health — OIOS health index + department grid.
 * Historical comparison uses synthetic prior-period points until history stores
 * are connected to the ECC.
 */
export function loadExecHealth(): ExecHealthViewModel {
  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
  const requestId = `exec-health-${Date.now()}`;

  const oios = intelligence.oios.service.build({ requestId: `${requestId}-oios`, scope });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
    oiosResult: oios,
  });

  const overall = Math.round(oios.health.score * 10) / 10;
  const prior30 = Math.round((overall - 2.4) * 10) / 10;
  const prior90 = Math.round((overall - 4.1) * 10) / 10;

  return {
    generatedAt: oios.generatedAt || new Date().toISOString(),
    overall: {
      score: overall,
      band: oios.health.band,
      narrative: `OIOS health ${overall} (${oios.health.band}). Wisdom composite ${Math.round(wisdom.health.overallScore)}.`,
    },
    departments: [
      {
        key: "operations",
        label: "Operations",
        score: Math.round(oios.health.dimensions.execution),
        href: "/exec/health",
        domain: "operations",
      },
      {
        key: "finance",
        label: "Finance",
        score: Math.round(oios.health.dimensions.financial),
        href: "/exec/finance",
        domain: "financial",
      },
      {
        key: "people",
        label: "People",
        score: Math.round(oios.health.dimensions.organizational),
        href: "/exec/workforce",
        domain: "human-capital",
      },
      {
        key: "customer",
        label: "Customer",
        score: Math.round((oios.health.dimensions.organizational + oios.health.dimensions.execution) / 2),
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
      { label: "30-day", delta: Math.round((overall - prior30) * 10) / 10, direction: overall >= prior30 ? "up" : "down" },
      { label: "90-day", delta: Math.round((overall - prior90) * 10) / 10, direction: overall >= prior90 ? "up" : "down" },
      { label: "vs prior period", delta: 1.8, direction: "up" },
    ],
    history: [
      { period: "Current", score: overall },
      { period: "30 days ago", score: prior30 },
      { period: "90 days ago", score: prior90 },
      { period: "Prior year (sample)", score: Math.round((overall - 6) * 10) / 10 },
    ],
    dataMode: "model-baseline",
  };
}
