/**
 * ChiefFinancialOfficerEngine — financial reasoning over FinanceEngine.
 * Recommends only; never modifies accounting records.
 */

import { runFinancialAnalysis, listAnalyses } from "./analysis";
import { askCfo, listAssistantAnswers } from "./assistant";
import { buildBenchmarks } from "./benchmarks";
import { buildBoardReport, listBoards } from "./board";
import { currentCashPosition } from "./cash";
import {
  computeEbitda,
  listAdjustments,
  listEbitda,
  recordEbitdaAdjustment,
} from "./ebitda";
import {
  CFO_SINKS,
  listCfoEvents,
  listCfoEvidence,
  listCfoMemory,
  listCfoTwin,
} from "./events";
import { forecastOutlook } from "./forecast";
import { generateInsights, listInsights } from "./insights";
import {
  evaluateMetrics,
  getMetricDefinition,
  listMetricDefinitions,
  metricValue,
} from "./metrics";
import { computeQoe, listQoe } from "./quality-of-earnings";
import {
  generateRecommendations,
  listRecommendations,
} from "./recommendations";
import { assessFinancialRisks } from "./risk";
import { computeRunway, listRunway } from "./runway";
import { analyzeScenario, listScenarios } from "./scenario-analysis";
import { CFO_GUARDS } from "./types";
import { computeValuation, listValuations, valuationHistory } from "./valuation";

export class ChiefFinancialOfficerEngine {
  readonly guards = CFO_GUARDS;
  readonly sinks = CFO_SINKS;

  // Metrics (canonical)
  listMetricDefinitions = listMetricDefinitions;
  getMetricDefinition = getMetricDefinition;
  evaluateMetrics = evaluateMetrics;
  metricValue = metricValue;

  // Analysis
  analyze = runFinancialAnalysis;
  listAnalyses = listAnalyses;
  benchmarks = buildBenchmarks;
  insights = generateInsights;
  listInsights = listInsights;
  risks = assessFinancialRisks;
  cashPosition = currentCashPosition;
  forecastOutlook = forecastOutlook;

  // EBITDA / QoE / Runway / Valuation
  recordEbitdaAdjustment = recordEbitdaAdjustment;
  computeEbitda = computeEbitda;
  listEbitda = listEbitda;
  listAdjustments = listAdjustments;
  computeQoe = computeQoe;
  listQoe = listQoe;
  computeRunway = computeRunway;
  listRunway = listRunway;
  computeValuation = computeValuation;
  listValuations = listValuations;
  valuationHistory = valuationHistory;

  // Scenarios / recommendations / board / assistant
  analyzeScenario = analyzeScenario;
  listScenarios = listScenarios;
  generateRecommendations = generateRecommendations;
  listRecommendations = listRecommendations;
  buildBoardReport = buildBoardReport;
  listBoards = listBoards;
  ask = askCfo;
  listAssistantAnswers = listAssistantAnswers;

  // OIOS
  listEvents = listCfoEvents;
  listTwinProjections = listCfoTwin;
  listEvidenceRecords = listCfoEvidence;
  listMemoryRecords = listCfoMemory;
}

export function createChiefFinancialOfficerEngine(): ChiefFinancialOfficerEngine {
  return new ChiefFinancialOfficerEngine();
}
