import fs from "node:fs";
import path from "node:path";
const DEST = path.resolve("src/lib/platform/intelligence/ethical");
const w = (n, c) => fs.writeFileSync(path.join(DEST, n), c, "utf8");

const LENS = (prefix) => `buildLens({
            valuesAlignment: \`\${${prefix}} values alignment.\`,
            fairness: \`\${${prefix}} fairness.\`,
            transparency: \`\${${prefix}} transparency.\`,
            accountability: \`\${${prefix}} accountability.\`,
            humanImpact: \`\${${prefix}} human impact.\`,
            biasRisk: \`\${${prefix}} bias risk.\`,
            governanceIntegrity: \`\${${prefix}} governance integrity.\`,
            longTermEthicalOutlook: \`\${${prefix}} long-term ethical outlook.\`,
          })`;

w("ethical-analysis-engine.ts", `import type { EthicalAnalysisEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_ANALYSIS_KINDS, type EthicalAnalysisSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalAnalysisEngine implements EthicalAnalysisEngineContract {
  assess(input: Parameters<EthicalAnalysisEngineContract["assess"]>[0]): EthicalAnalysisSuite {
    const scoreFor = (kind: (typeof ETHICAL_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "values_alignment": return clamp(input.baseline.valuesAlignment);
        case "fairness": return clamp(input.baseline.fairness);
        case "transparency": return clamp(input.baseline.transparency);
        case "accountability": return clamp(input.baseline.accountability);
        case "human_impact": return clamp(input.baseline.humanImpact);
        case "bias_risk": return clamp(input.baseline.biasRisk);
        case "governance_integrity": return clamp(input.baseline.governanceIntegrity);
        case "ethical_risk": return clamp(input.baseline.areaScores.ethical_risk);
        case "early_warning": return clamp(input.baseline.longTermEthicalOutlook);
        default: return 65;
      }
    };
    const analyses = ETHICAL_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("eth-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          valuesAlignment: \`Values alignment through \${kind}.\`,
          fairness: \`Fairness reading for \${kind}.\`,
          transparency: \`Transparency for \${kind}.\`,
          accountability: \`Accountability around \${kind}.\`,
          humanImpact: \`Human impact of \${kind}.\`,
          biasRisk: \`Bias risk in \${kind}.\`,
          governanceIntegrity: \`Governance integrity for \${kind}.\`,
          longTermEthicalOutlook: \`Long-term ethical outlook via \${kind}.\`,
        }),
        narrative: \`\${kind} analysis scored \${Math.round(score)}.\`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...ETHICAL_ANALYSIS_KINDS],
      maturityScore,
      narrative: \`Ethical analysis maturity \${Math.round(maturityScore)} across \${analyses.length} kinds.\`,
    };
  }
}
`);

w("ethical-forecast-engine.ts", `import type { EthicalForecastEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_AREAS, type EthicalForecastSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalForecastEngine implements EthicalForecastEngineContract {
  assess(input: Parameters<EthicalForecastEngineContract["assess"]>[0]): EthicalForecastSuite {
    const forecasts = ETHICAL_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("eth-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: buildLens({
          valuesAlignment: \`Forecast values alignment for \${area}.\`,
          fairness: \`Forecast fairness for \${area}.\`,
          transparency: \`Forecast transparency for \${area}.\`,
          accountability: \`Forecast accountability for \${area}.\`,
          humanImpact: \`Forecast human impact for \${area}.\`,
          biasRisk: \`Forecast bias risk for \${area}.\`,
          governanceIntegrity: \`Forecast governance integrity for \${area}.\`,
          longTermEthicalOutlook: \`Long-term ethical outlook forecast for \${area}.\`,
        }),
        narrative: \`\${area} forecast \${Math.round(forecast)} from baseline \${Math.round(baseline)}.\`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: \`Ethical forecast maturity \${Math.round(maturityScore)}.\`,
    };
  }
}
`);

w("ethical-trend-engine.ts", `import type { EthicalTrendEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_AREAS, type EthicalTrendSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalTrendEngine implements EthicalTrendEngineContract {
  assess(input: Parameters<EthicalTrendEngineContract["assess"]>[0]): EthicalTrendSuite {
    const trends = ETHICAL_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("eth-trend"),
        area,
        title: \`\${area.replaceAll("_", " ")} trend\`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
          valuesAlignment: \`Trend values alignment for \${area}.\`,
          fairness: \`Trend fairness for \${area}.\`,
          transparency: \`Trend transparency for \${area}.\`,
          accountability: \`Trend accountability for \${area}.\`,
          humanImpact: \`Trend human impact for \${area}.\`,
          biasRisk: \`Trend bias risk for \${area}.\`,
          governanceIntegrity: \`Trend governance integrity for \${area}.\`,
          longTermEthicalOutlook: \`Long-term ethical outlook trend for \${area}.\`,
        }),
        narrative: \`\${area} is \${direction} at magnitude \${Math.round(Math.abs(score - 65))}.\`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: \`Ethical trends: \${trends.filter(t => t.direction === "improving").length} improving, \${trends.filter(t => t.direction === "worsening").length} worsening.\`,
    };
  }
}
`);

w("ethical-scenario-engine.ts", `import type { EthicalScenarioEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_SCENARIOS, type EthicalScenarioSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalScenarioEngine implements EthicalScenarioEngineContract {
  assess(input: Parameters<EthicalScenarioEngineContract["assess"]>[0]): EthicalScenarioSuite {
    const scenarios = ETHICAL_SCENARIOS.map((kind, index) => {
      const pressure = 100 - input.baseline.areaScores.ethical_risk;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("eth-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        valuesImpact: clamp(input.baseline.valuesAlignment - index * 2),
        humanImpact: clamp(input.baseline.humanImpact - index * 2),
        monitors: [\`monitor:\${kind}\`, "monitor:ethical-risk"],
        lenses: buildLens({
          valuesAlignment: \`Scenario values alignment for \${kind}.\`,
          fairness: \`Scenario fairness for \${kind}.\`,
          transparency: \`Scenario transparency for \${kind}.\`,
          accountability: \`Scenario accountability for \${kind}.\`,
          humanImpact: \`Scenario human impact for \${kind}.\`,
          biasRisk: \`Scenario bias risk for \${kind}.\`,
          governanceIntegrity: \`Scenario governance integrity for \${kind}.\`,
          longTermEthicalOutlook: \`Long-term ethical outlook under \${kind}.\`,
        }),
        narrative: \`\${kind} probability \${Math.round(probability * 100)}% with impact \${Math.round(organizationalImpact)}.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary ethical scenario \${primary.kind.replaceAll("_", " ")}.\`,
    };
  }
}
`);

w("early-warning-engine.ts", `import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/ethical/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/ethical/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening").slice(0, 4);
    const hot = input.scenarios.scenarios.slice(0, 3);
    const alerts = [
      ...worsening.map(t => ({
        id: input.createId("eth-alert"),
        title: \`Trend alert: \${t.area}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("eth-alert"),
        title: \`Scenario alert: \${s.kind}\`,
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
      narrative: \`Ethical early warning suite with \${alerts.length} alerts.\`,
    };
  }
}
`);

// Fix projection outlook strings if any
let proj = fs.readFileSync(path.join(DEST, "projection.ts"), "utf8");
proj = proj.replaceAll("cohesive", "principled").replaceAll("fragmented", "contested");
fs.writeFileSync(path.join(DEST, "projection.ts"), proj, "utf8");

console.log("standard engines + projection patched");