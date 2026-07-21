import type { DomainHealthScore, FounderOpportunity, FounderRisk } from "./types";
import type { BriefItem, InsightSeverity } from "./types";
import type { EiEventSignal } from "./events";
import { domainForEvent, severityRank } from "./events";

function severityFromRank(rank: number): InsightSeverity {
  if (rank >= 90) return "critical";
  if (rank >= 75) return "high";
  if (rank >= 55) return "medium";
  if (rank >= 40) return "low";
  return "info";
}

export function buildExecutiveBrief(
  signals: EiEventSignal[],
  risks: FounderRisk[],
  opportunities: FounderOpportunity[],
  overall: DomainHealthScore,
  now = new Date()
): BriefItem[] {
  const nowIso = now.toISOString();
  const items: BriefItem[] = [];

  items.push({
    id: "brief-health",
    title: `Organization health: ${overall.score}/100 (${overall.trend})`,
    summary: overall.factors.slice(0, 3).join(" · "),
    domain: "organization",
    severity:
      overall.score < 50 ? "critical" : overall.score < 65 ? "high" : overall.score < 80 ? "medium" : "info",
    priority: overall.score < 65 ? 95 : 40,
    explainability: {
      why: "Aggregated domain health scores from EI event analysis.",
      evidence: overall.factors,
      relatedEventIds: [],
      confidence: overall.confidence,
      lastUpdated: nowIso,
    },
  });

  for (const risk of risks.slice(0, 6)) {
    items.push({
      id: `brief-${risk.id}`,
      title: risk.title,
      summary: risk.summary,
      domain: risk.domain,
      severity: risk.severity,
      priority: Math.round((risk.probability + risk.impact) / 2),
      explainability: risk.explainability,
    });
  }

  for (const opp of opportunities.slice(0, 3)) {
    items.push({
      id: `brief-${opp.id}`,
      title: opp.title,
      summary: opp.summary,
      domain: opp.domain,
      severity: "info",
      priority: Math.round(35 + opp.confidence * 30),
      explainability: opp.explainability,
    });
  }

  // Top live EI signals by severity
  const ranked = [...signals]
    .map((s) => ({ s, rank: severityRank(s.eventType, s.classification) }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 8);

  for (const { s, rank } of ranked) {
    items.push({
      id: `brief-evt-${s.id}`,
      title: s.title,
      summary: s.summary ?? s.eventType,
      domain: domainForEvent(s.eventType, s.moduleKey),
      severity: severityFromRank(rank),
      priority: rank,
      explainability: {
        why: "Surfaced from live Executive Intelligence activity feed.",
        evidence: [`${s.eventType} @ ${s.occurredAt}`],
        relatedEventIds: [s.id],
        confidence: 0.9,
        lastUpdated: nowIso,
      },
    });
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, 20);
}

export function buildTodaysPriorities(brief: BriefItem[]): BriefItem[] {
  return brief.filter((b) => b.priority >= 60 || b.severity === "high" || b.severity === "critical").slice(0, 8);
}
