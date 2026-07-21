import type { DomainHealthScore, FounderKpi, FounderRisk } from "./types";
import type { EiEventSignal } from "./events";
import { countByDomain } from "./events";

export function buildFounderKpis(
  signals: EiEventSignal[],
  health: DomainHealthScore[],
  risks: FounderRisk[]
): FounderKpi[] {
  const counts = countByDomain(signals);
  const overall = health.find((h) => h.domain === "organization");
  const finance = health.find((h) => h.domain === "finance");
  const hc = health.find((h) => h.domain === "human_capital");

  return [
    {
      key: "org_health",
      label: "Org Health",
      value: overall?.score ?? 0,
      unit: "score",
      trend: overall?.trend ?? "stable",
      domain: "organization",
    },
    {
      key: "open_risks",
      label: "Open Risks",
      value: risks.filter((r) => r.severity === "high" || r.severity === "critical").length,
      trend: risks.length > 3 ? "up" : "stable",
      domain: "organization",
    },
    {
      key: "finance_health",
      label: "Finance Health",
      value: finance?.score ?? 0,
      unit: "score",
      trend: finance?.trend ?? "stable",
      domain: "finance",
    },
    {
      key: "workforce_health",
      label: "Workforce Health",
      value: hc?.score ?? 0,
      unit: "score",
      trend: hc?.trend ?? "stable",
      domain: "human_capital",
    },
    {
      key: "ei_signals_72h",
      label: "EI Signals (72h)",
      value: counts.organization,
      trend: counts.organization > 50 ? "up" : "stable",
      domain: "technology",
    },
    {
      key: "admissions_signals",
      label: "Admissions Activity",
      value: counts.admissions,
      trend: "stable",
      domain: "admissions",
    },
  ];
}
