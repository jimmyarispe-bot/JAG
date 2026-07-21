/**
 * Strategic alignment scoring with explainability.
 */

import type {
  AlignmentScore,
  InitiativeLight,
  PortfolioRequest,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

function bandFromScore(score: number): AlignmentScore["band"] {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function scoreStrategicAlignment(
  initiative: InitiativeLight,
  request: PortfolioRequest
): AlignmentScore {
  const text = `${initiative.title ?? ""} ${initiative.executiveSummary ?? ""} ${initiative.businessCase ?? ""}`.toLowerCase();
  const mission = (request.missionHint ?? "student outcomes mission").toLowerCase();
  const vision = (request.visionHint ?? "sustainable growth vision").toLowerCase();
  const objectives = request.annualObjectives ?? ["enrollment", "quality", "financial sustainability"];
  const boardGoals = request.boardGoals ?? ["risk oversight", "mission fidelity"];

  const factors: AlignmentScore["factors"] = [];

  const missionHit = mission.split(/\s+/).some((w) => w.length > 3 && text.includes(w)) ? 85 : 55;
  factors.push({
    factor: "Mission",
    weight: 0.25,
    contribution: missionHit,
    note: missionHit >= 70 ? "Language aligns with mission themes" : "Limited explicit mission overlap",
  });

  const visionHit = vision.split(/\s+/).some((w) => w.length > 3 && text.includes(w)) ? 80 : 50;
  factors.push({
    factor: "Vision",
    weight: 0.15,
    contribution: visionHit,
    note: visionHit >= 70 ? "Supports stated vision" : "Indirect vision support",
  });

  const objHits = objectives.filter((o) => text.includes(o.toLowerCase())).length;
  const objScore = Math.min(100, 40 + objHits * 25);
  factors.push({
    factor: "Annual objectives",
    weight: 0.25,
    contribution: objScore,
    note: `${objHits}/${objectives.length} objective themes matched`,
  });

  const boardHits = boardGoals.filter((g) => text.includes(g.toLowerCase().split(/\s+/)[0] ?? "")).length;
  const boardScore = Math.min(100, 45 + boardHits * 20);
  factors.push({
    factor: "Board goals",
    weight: 0.15,
    contribution: boardScore,
    note: boardHits > 0 ? "Touches board-priority language" : "Board linkage inferred",
  });

  const health = initiative.progress?.healthScore ?? 50;
  const directiveScore = Math.min(100, Math.round(health * 0.9 + (initiative.state === "approved" || initiative.state === "active" ? 15 : 0)));
  factors.push({
    factor: "Executive directives",
    weight: 0.2,
    contribution: directiveScore,
    note: "Derived from initiative health / lifecycle posture",
  });

  const score = Math.round(
    factors.reduce((acc, f) => acc + f.contribution * f.weight, 0)
  );
  const band = bandFromScore(score);

  return {
    band,
    score,
    factors,
    explainability: `${initiative.title ?? "Initiative"} alignment is ${band} (${score}) — weighted across mission, vision, objectives, board goals, and executive posture.`,
  };
}
