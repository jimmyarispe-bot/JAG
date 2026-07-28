import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { runFinancialAnalysis } from "../analysis";
import { generateInsights } from "../insights";
import { evaluateMetrics, metricValue } from "../metrics";
import { generateRecommendations } from "../recommendations";
import { assessFinancialRisks } from "../risk";
import { computeRunway } from "../runway";
import { listBoards, upsertBoard } from "../store";
import type { BoardReport } from "../types";

export function buildBoardReport(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): BoardReport {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  const analysis = runFinancialAnalysis(input);
  const runway = computeRunway(input);
  const risks = assessFinancialRisks(input);
  const recommendations = generateRecommendations(input);
  const insights = generateInsights(input);

  const report = upsertBoard({
    id: newId("board"),
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    executiveSummary: `Period ${input.periodKey}: revenue ${metricValue(snap, "revenue")?.toFixed(0) ?? 0}, EBITDA ${metricValue(snap, "ebitda")?.toFixed(0) ?? 0}, cash runway ${runway.runwayMonths?.toFixed(1) ?? "n/a"} months.`,
    financialHighlights: Object.freeze([
      ...analysis.profitability.slice(0, 3),
      ...analysis.liquidity.slice(0, 2),
    ]),
    keyRisks: Object.freeze([...risks]),
    strategicOpportunities: Object.freeze(
      insights
        .filter((i) => i.kind === "emerging_opportunity" || i.kind === "positive_trend")
        .map((i) => i.title)
    ),
    cashPosition: runway.currentCash,
    liquidityNotes: `Current ratio ${metricValue(snap, "current_ratio") ?? "n/a"}; runway ${runway.runwayMonths?.toFixed(1) ?? "n/a"} months.`,
    budgetStatus: analysis.comparative[0] ?? "Budget comparison unavailable",
    forecastSummary: analysis.comparative[1] ?? "Forecast summary unavailable",
    varianceSummary: analysis.trends.join("; "),
    recommendations,
    actionItems: Object.freeze(
      recommendations.slice(0, 5).map((r) => r.title)
    ),
    generatedAt: nowIso(),
  });

  publishCfoEvent({
    type: "cfo.board_report_built",
    organizationId: input.organizationId,
    recordType: "board_report",
    recordId: report.id,
    actorUserId: input.userId,
    payload: {
      periodKey: input.periodKey,
      recommendationCount: recommendations.length,
    },
  });
  return report;
}

export { listBoards };
