/**
 * Composite initiative prioritization.
 */

import { scoreConfidence } from "@/lib/platform/intelligence/portfolio-intelligence/scoring/confidence-score";
import { scoreRoi } from "@/lib/platform/intelligence/portfolio-intelligence/scoring/roi-score";
import { scoreRisk } from "@/lib/platform/intelligence/portfolio-intelligence/scoring/risk-score";
import { scoreStrategicAlignment } from "@/lib/platform/intelligence/portfolio-intelligence/scoring/strategic-alignment";
import { scoreUrgency } from "@/lib/platform/intelligence/portfolio-intelligence/scoring/urgency-score";
import type {
  InitiativeLight,
  PortfolioRequest,
  PriorityScorecard,
  ScoredInitiative,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

function resourceDemand(initiative: InitiativeLight): number {
  const planned = initiative.budget?.planned ?? 50_000;
  const normalized = Math.min(100, Math.round(planned / 2_000));
  const ownerLoad = Math.min(30, (initiative.owners?.length ?? 1) * 8);
  return Math.min(100, normalized + ownerLoad);
}

function impactScore(initiative: InitiativeLight): number {
  const kpi = initiative.progress?.kpiAchievement ?? 40;
  const health = initiative.progress?.healthScore ?? 50;
  return Math.round(kpi * 0.45 + health * 0.35 + 20);
}

function executivePriority(initiative: InitiativeLight): number {
  const state = initiative.state ?? "proposed";
  if (state === "active" || state === "at_risk") return 85;
  if (state === "planned" || state === "approved") return 70;
  if (state === "proposed") return 55;
  return 40;
}

export class PrioritizationEngine {
  constructor(private readonly now: () => Date = () => new Date()) {}

  scoreAll(initiatives: InitiativeLight[], request: PortfolioRequest): ScoredInitiative[] {
    const decisionRoi =
      request.decisionResult?.recommendation?.rankedOptions?.[0]?.scorecard?.roi;

    const scored = initiatives.map((initiative, idx) => {
      const id = initiative.id ?? `init-${idx}`;
      const alignment = scoreStrategicAlignment(initiative, request);
      const impact = impactScore(initiative);
      const roi = scoreRoi(initiative, decisionRoi);
      const risk = scoreRisk(initiative);
      const urgency = scoreUrgency(initiative, this.now());
      const resource = resourceDemand(initiative);
      const execPri = executivePriority(initiative);
      const confidence = scoreConfidence(initiative, request.predictiveResult);

      // Higher risk lowers composite; higher resource demand slightly lowers priority.
      const composite = Math.round(
        impact * 0.2 +
          alignment.score * 0.18 +
          roi * 0.15 +
          (100 - risk) * 0.12 +
          urgency * 0.12 +
          (100 - resource) * 0.08 +
          execPri * 0.1 +
          confidence * 0.05
      );

      const priority: PriorityScorecard = {
        initiativeId: id,
        title: initiative.title ?? id,
        composite,
        rank: 0,
        impact,
        alignment: alignment.score,
        roi,
        risk,
        urgency,
        resourceDemand: resource,
        executivePriority: execPri,
        predictionConfidence: confidence,
        explainability: `Composite ${composite}: impact ${impact}, alignment ${alignment.score} (${alignment.band}), ROI ${roi}, risk ${risk}, urgency ${urgency}.`,
      };

      return { initiative: { ...initiative, id }, alignment, priority };
    });

    scored.sort((a, b) => b.priority.composite - a.priority.composite);
    scored.forEach((s, i) => {
      s.priority.rank = i + 1;
    });

    return scored;
  }

  ranked(scored: ScoredInitiative[]): PriorityScorecard[] {
    return scored.map((s) => s.priority);
  }
}
