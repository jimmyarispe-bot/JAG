import { buildConfidence } from "@/lib/platform/intelligence/competitive/models";
import type { CompetitiveProjectionResult, CompetitiveQueryRequest, CompetitiveQueryResult, CompetitiveResult } from "@/lib/platform/intelligence/competitive/types";

export class CompetitiveProjection {
  project(input: Omit<CompetitiveProjectionResult, "forecast">): CompetitiveProjectionResult {
    return { ...input, forecast: Math.min(100, input.healthScore + (input.outlook === "advancing" ? 6 : input.outlook === "pressured" ? -4 : 2)) };
  }
}

export class CompetitiveQueries {
  ask(result: CompetitiveResult, request: CompetitiveQueryRequest): CompetitiveQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer = result.brief.headline;
    let references: string[] = result.recommendations.slice(0, max).map(r => r.title);
    if (focus === "trends") { answer = result.trendSuite.narrative; references = result.trendSuite.trends.slice(0, max).map(t => t.title); }
    else if (focus === "forecasts") { answer = result.forecastSuite.narrative; references = result.forecastSuite.forecasts.slice(0, max).map(f => f.narrative); }
    else if (focus === "scenarios") { answer = result.scenarioSuite.narrative; references = result.scenarioSuite.scenarios.slice(0, max).map(s => s.title); }
    else if (focus === "analysis") { answer = result.analysisSuite.narrative; references = result.analysisSuite.analyses.slice(0, max).map(a => a.title); }
    else if (focus === "reasoning") { answer = result.reasoning.answer; references = result.reasoning.connectedForces.slice(0, max); }
    else if (focus === "learning") { answer = result.closedLearningLoop.narrative; references = result.closedLearningLoop.lessons.slice(0, max); }
    else if (focus === "recommendations") { answer = `${result.recommendations.length} competitive recommendations.`; }
    else if (focus in result.areaSuites) {
      const suite = result.areaSuites[focus as keyof typeof result.areaSuites];
      answer = suite.narrative;
      references = suite.records.slice(0, max).map(r => r.title);
    }
    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? .6 : .85 },
      ]),
    };
  }
}
