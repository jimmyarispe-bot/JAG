import type { FounderOpportunity } from "./types";
import type { FounderPrediction } from "./types";
import type { FounderRecommendation, FounderRisk } from "./types";

export function generateRecommendations(
  risks: FounderRisk[],
  opportunities: FounderOpportunity[],
  predictions: FounderPrediction[],
  now = new Date()
): FounderRecommendation[] {
  const nowIso = now.toISOString();
  const recs: FounderRecommendation[] = [];

  for (const risk of risks.slice(0, 8)) {
    recs.push({
      id: `rec-risk-${risk.id}`,
      title: risk.recommendedAction,
      summary: risk.summary,
      domain: risk.domain,
      priority: Math.round((risk.probability + risk.impact) / 2),
      impact: `${risk.severity} risk mitigation`,
      confidence: risk.explainability.confidence,
      relatedEntities: [],
      suggestedActions: [
        risk.recommendedAction,
        "Track in Decision Center",
        "Assign owner if delegated",
      ],
      explainability: {
        ...risk.explainability,
        why: `Recommendation derived from risk: ${risk.title}. ${risk.explainability.why}`,
        lastUpdated: nowIso,
      },
    });
  }

  for (const opp of opportunities.slice(0, 6)) {
    recs.push({
      id: `rec-opp-${opp.id}`,
      title: opp.recommendedAction,
      summary: opp.summary,
      domain: opp.domain,
      priority: Math.round(40 + opp.confidence * 40),
      impact: opp.estimatedValue
        ? `~$${Math.round(opp.estimatedValue).toLocaleString()} potential`
        : "Operational upside",
      confidence: opp.confidence,
      relatedEntities: [],
      suggestedActions: [opp.recommendedAction, "Schedule review"],
      explainability: {
        ...opp.explainability,
        why: `Recommendation derived from opportunity: ${opp.title}. ${opp.explainability.why}`,
        lastUpdated: nowIso,
      },
    });
  }

  const hiring = predictions.find((p) => p.id === "pred-hiring");
  if (hiring && hiring.mid >= 1) {
    recs.push({
      id: "rec-hire-specialist",
      title: "Hire another specialist for capacity gaps",
      summary: `Hiring forecast mid-point is ${hiring.mid} role(s).`,
      domain: "human_capital",
      priority: 72,
      impact: "Protect instructional capacity",
      confidence: hiring.confidence,
      relatedEntities: [],
      suggestedActions: [
        "Open recruiting requisition",
        "Review literacy / subject shortages",
      ],
      explainability: {
        why: "Prediction engine hiring needs exceeded threshold.",
        evidence: hiring.factors,
        relatedEventIds: hiring.explainability.relatedEventIds,
        confidence: hiring.confidence,
        lastUpdated: nowIso,
      },
    });
  }

  const certRisk = risks.find((r) => r.id.includes("cert"));
  if (certRisk) {
    recs.push({
      id: "rec-renew-cert",
      title: "Renew Teacher certifications before expiry",
      summary: certRisk.summary,
      domain: "human_capital",
      priority: 88,
      impact: "Compliance continuity",
      confidence: certRisk.explainability.confidence,
      relatedEntities: [],
      suggestedActions: ["Notify affected employees", "Schedule renewal training"],
      explainability: certRisk.explainability,
    });
  }

  const wfRisk = risks.find((r) => r.id.includes("workflow"));
  if (wfRisk) {
    recs.push({
      id: "rec-archive-workflows",
      title: "Archive inactive / failing workflows",
      summary: wfRisk.summary,
      domain: "workflows",
      priority: 65,
      impact: "Reduce automation noise",
      confidence: wfRisk.explainability.confidence,
      relatedEntities: [],
      suggestedActions: ["Review failed runs", "Disable unused workflows"],
      explainability: wfRisk.explainability,
    });
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return recs
    .filter((r) => {
      if (seen.has(r.title)) return false;
      seen.add(r.title);
      return true;
    })
    .sort((a, b) => b.priority - a.priority);
}
