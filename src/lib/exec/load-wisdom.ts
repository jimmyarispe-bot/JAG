import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
import type { ExecWisdomViewModel } from "@/lib/exec/view-models";

/**
 * Wisdom Center — terminal organizational judgment from Wisdom Intelligence.
 */
export function loadExecWisdom(): ExecWisdomViewModel {
  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
  const requestId = `exec-wisdom-${Date.now()}`;

  const oios = intelligence.oios.service.build({ requestId: `${requestId}-oios`, scope });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
    oiosResult: oios,
  });

  const tradeOffSignals = wisdom.tradeOffAnalysisDashboard?.signals ?? [];
  const ethicalSignals = [
    wisdom.brief.lenses.ethicalIntegrity,
    wisdom.areaSuites.ethical_judgment?.narrative,
    `Ethical judgment score ${Math.round(wisdom.ethicalJudgmentScore.value)}.`,
  ].filter(Boolean) as string[];
  const longTermSignals = [
    wisdom.longTermOutlookDashboard?.narrative,
    ...(wisdom.longTermOutlookDashboard?.signals ?? []).slice(0, 3),
    wisdom.brief.lenses.longTermImpact,
  ].filter(Boolean) as string[];

  return {
    generatedAt: wisdom.generatedAt,
    recommendations: wisdom.recommendations.map((rec) => ({
      id: rec.id,
      title: rec.title,
      priority: rec.priority,
      confidence: Math.round(rec.confidenceScore * 1000) / 10,
      rationale: rec.rationale,
      action: rec.action,
      lenses: { ...rec.lenses },
      evidenceRefs: rec.evidenceRefs,
      narrative: rec.narrative,
    })),
    tradeOffs: tradeOffSignals.length
      ? tradeOffSignals
      : [
          wisdom.tradeOffAnalysisDashboard?.narrative ??
            "Trade-off balance requires confirmation against live constraints.",
        ],
    judgment: { ...wisdom.brief.judgment },
    ethical: ethicalSignals,
    longTerm: longTermSignals,
    confidence: {
      value: Math.round(
        (wisdom.confidence.value <= 1 ? wisdom.confidence.value * 100 : wisdom.confidence.value) * 10
      ) / 10,
      level: String(wisdom.confidence.level),
    },
    dataMode: "model-baseline",
  };
}
