import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/ethical/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/ethical/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening").slice(0, 4);
    const hot = input.scenarios.scenarios.slice(0, 3);
    const alerts = [
      ...worsening.map(t => ({
        id: input.createId("eth-alert"),
        title: `Trend alert: ${t.area}`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("eth-alert"),
        title: `Scenario alert: ${s.kind}`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.longTermEthicalOutlook);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: `Ethical early warning suite with ${alerts.length} alerts.`,
    };
  }
}
