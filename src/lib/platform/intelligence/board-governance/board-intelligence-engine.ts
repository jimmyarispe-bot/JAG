/**
 * Board & Governance Intelligence — BoardIntelligenceEngine (Sprint 029).
 *
 * Orchestrates packet generation, oversight artifacts, projection, and history.
 */

import type {
  BoardIntelligenceEngine as BoardIntelligenceEngineContract,
  BoardGovernanceDependencies,
  BoardKPIDashboard as BoardKPIDashboardContract,
  BoardPacketGenerator as BoardPacketGeneratorContract,
  BoardQueries as BoardQueriesContract,
  CommitteeReporting as CommitteeReportingContract,
  ComplianceMonitor as ComplianceMonitorContract,
  ExecutiveBriefGenerator as ExecutiveBriefGeneratorContract,
  ExecutiveScorecards as ExecutiveScorecardsContract,
  GovernanceCalendar as GovernanceCalendarContract,
  GovernanceDashboard as GovernanceDashboardContract,
  GovernanceEngine as GovernanceEngineContract,
  GovernanceProjection as GovernanceProjectionContract,
  GovernanceRepository as GovernanceRepositoryContract,
  ResolutionTracker as ResolutionTrackerContract,
  RiskRegister as RiskRegisterContract,
  StrategicInitiativeTracker as StrategicInitiativeTrackerContract,
} from "@/lib/platform/intelligence/board-governance/contracts";
import { BoardPacketGenerator as BoardPacketGeneratorEngine } from "@/lib/platform/intelligence/board-governance/board-packet-generator";
import { CommitteeReporting as CommitteeReportingEngine } from "@/lib/platform/intelligence/board-governance/committee-reporting";
import { ComplianceMonitor as ComplianceMonitorEngine } from "@/lib/platform/intelligence/board-governance/compliance-monitor";
import { ExecutiveBriefGenerator as ExecutiveBriefGeneratorEngine } from "@/lib/platform/intelligence/board-governance/executive-brief-generator";
import { ExecutiveScorecards as ExecutiveScorecardsEngine } from "@/lib/platform/intelligence/board-governance/executive-scorecards";
import { GovernanceCalendar as GovernanceCalendarEngine } from "@/lib/platform/intelligence/board-governance/governance-calendar";
import {
  BoardKPIDashboard as BoardKPIDashboardEngine,
  GovernanceDashboard as GovernanceDashboardEngine,
} from "@/lib/platform/intelligence/board-governance/governance-dashboard";
import { GovernanceEngine as GovernanceEngineImpl } from "@/lib/platform/intelligence/board-governance/governance-engine";
import {
  buildBoardKpis,
  defaultPeriodLabel,
  deriveGovernanceBaseline,
  levelFromValue,
  resolvePacketKinds,
} from "@/lib/platform/intelligence/board-governance/models";
import { GovernanceProjection as GovernanceProjectionEngine } from "@/lib/platform/intelligence/board-governance/projection";
import { BoardQueries as BoardQueriesEngine } from "@/lib/platform/intelligence/board-governance/queries";
import { GovernanceRepository as GovernanceRepositoryStore } from "@/lib/platform/intelligence/board-governance/repository";
import { ResolutionTracker as ResolutionTrackerEngine } from "@/lib/platform/intelligence/board-governance/resolution-tracker";
import { RiskRegister as RiskRegisterEngine } from "@/lib/platform/intelligence/board-governance/risk-register";
import { StrategicInitiativeTracker as StrategicInitiativeTrackerEngine } from "@/lib/platform/intelligence/board-governance/strategic-initiative-tracker";
import type {
  GovernanceConfidenceScore,
  GovernanceRequest,
  GovernanceResult,
} from "@/lib/platform/intelligence/board-governance/types";
import type {
  Graph,
  GraphAnalysisResult,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface BoardIntelligenceEngineDependencies
  extends BoardGovernanceDependencies {}

/**
 * BoardIntelligenceEngine — core orchestrator for board & governance outputs.
 */
export class BoardIntelligenceEngineImpl
  implements BoardIntelligenceEngineContract
{
  private readonly governanceEngine: GovernanceEngineContract;
  private readonly packetGenerator: BoardPacketGeneratorContract;
  private readonly briefGenerator: ExecutiveBriefGeneratorContract;
  private readonly committeeReporting: CommitteeReportingContract;
  private readonly initiativeTracker: StrategicInitiativeTrackerContract;
  private readonly governanceDashboard: GovernanceDashboardContract;
  private readonly kpiDashboard: BoardKPIDashboardContract;
  private readonly riskRegister: RiskRegisterContract;
  private readonly complianceMonitor: ComplianceMonitorContract;
  private readonly scorecards: ExecutiveScorecardsContract;
  private readonly resolutionTracker: ResolutionTrackerContract;
  private readonly calendar: GovernanceCalendarContract;
  private readonly projection: GovernanceProjectionContract;
  private readonly repositoryStore: GovernanceRepositoryContract;
  private readonly buildAndAnalyze:
    | ((input?: GovernanceRequest["graphInput"]) => {
        graph: Graph;
        analysis: GraphAnalysisResult;
      })
    | null;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  readonly queries: BoardQueriesContract;

  constructor(dependencies: BoardIntelligenceEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    this.now = now;
    this.createId = createId;
    this.buildAndAnalyze = dependencies.buildAndAnalyze ?? null;

    this.governanceEngine =
      dependencies.governanceEngine ?? new GovernanceEngineImpl();
    this.packetGenerator =
      dependencies.packetGenerator ??
      new BoardPacketGeneratorEngine({ createId });
    this.briefGenerator =
      dependencies.briefGenerator ??
      new ExecutiveBriefGeneratorEngine({ createId });
    this.committeeReporting =
      dependencies.committeeReporting ??
      new CommitteeReportingEngine({ createId });
    this.initiativeTracker =
      dependencies.initiativeTracker ??
      new StrategicInitiativeTrackerEngine({ createId });
    this.governanceDashboard =
      dependencies.governanceDashboard ?? new GovernanceDashboardEngine();
    this.kpiDashboard =
      dependencies.kpiDashboard ?? new BoardKPIDashboardEngine();
    this.riskRegister =
      dependencies.riskRegister ?? new RiskRegisterEngine({ createId });
    this.complianceMonitor =
      dependencies.complianceMonitor ??
      new ComplianceMonitorEngine({ createId });
    this.scorecards =
      dependencies.scorecards ?? new ExecutiveScorecardsEngine({ createId });
    this.resolutionTracker =
      dependencies.resolutionTracker ??
      new ResolutionTrackerEngine({ createId });
    this.calendar =
      dependencies.calendar ?? new GovernanceCalendarEngine({ createId });
    this.projection =
      dependencies.projection ?? new GovernanceProjectionEngine();
    this.repositoryStore =
      dependencies.repository ?? new GovernanceRepositoryStore();
    this.queries =
      dependencies.queries ?? new BoardQueriesEngine();
  }

  get repository(): GovernanceRepositoryContract {
    return this.repositoryStore;
  }

  generate(request: GovernanceRequest): GovernanceResult {
    const now = this.now();
    let analysis = request.analysis ?? null;
    let graph = request.graph ?? null;
    let graphInput = request.graphInput;

    if (!analysis && graphInput && this.buildAndAnalyze) {
      const built = this.buildAndAnalyze(graphInput);
      graph = built.graph;
      analysis = built.analysis;
    }

    void graph;

    const baseline = deriveGovernanceBaseline(
      analysis,
      graphInput,
      request.decisionResult?.baseline ?? null,
      request.predictionResult ?? null,
      request.baselineOverrides
    );

    const confidence = this.scoreConfidence(request, analysis);
    const kpis = buildBoardKpis(baseline, this.createId);
    const risks = this.riskRegister.build({ request, baseline, now });
    const heatMap = this.riskRegister.heatMap(risks);
    const initiatives = this.initiativeTracker.track({
      request,
      baseline,
      now,
    });
    const compliance = this.complianceMonitor.monitor({
      request,
      baseline,
      now,
    });
    const resolutions = this.resolutionTracker.track({
      request,
      initiatives,
      now,
    });
    const calendar = this.calendar.build({ request, resolutions, now });
    const scorecards = this.scorecards.build({
      request,
      baseline,
      kpis,
      now,
    });
    const committees = this.committeeReporting.build({
      request,
      baseline,
      kpis,
      risks,
      initiatives,
      confidence,
      now,
    });
    const periodLabel = request.periodLabel ?? defaultPeriodLabel(now);
    const dashboard = this.governanceDashboard.build({
      baseline,
      kpis,
      risks,
      initiatives,
      compliance,
      resolutions,
      calendar,
      now,
    });
    const kpiDashboard = this.kpiDashboard.build({
      kpis,
      periodLabel,
      now,
    });
    const brief = this.briefGenerator.generate({
      request,
      baseline,
      kpis,
      risks,
      initiatives,
      compliance,
      resolutions,
      confidence,
      now,
    });

    const packetKinds = resolvePacketKinds(request.packetKinds);
    const packets = packetKinds.map((kind) =>
      this.packetGenerator.generate({
        kind,
        request,
        baseline,
        kpis,
        risks,
        initiatives,
        compliance,
        resolutions,
        committees,
        scorecards,
        calendar,
        confidence,
        now,
      })
    );

    for (const packet of packets) {
      this.repositoryStore.save(packet);
    }

    const projection = this.projection.project({
      request,
      packets,
      brief,
      dashboard,
      kpiDashboard,
      heatMap,
      risks,
      initiatives,
      compliance,
      resolutions,
      committees,
      confidence,
    });

    const result = this.governanceEngine.compose({
      request,
      baseline,
      kpis,
      risks,
      initiatives,
      compliance,
      resolutions,
      scorecards,
      committees,
      calendar,
      packets,
      brief,
      dashboard,
      kpiDashboard,
      heatMap,
      confidence,
      now,
    });

    result.projection = projection;
    this.repositoryStore.saveHistory(result.historyRecord);
    return result;
  }

  private scoreConfidence(
    request: GovernanceRequest,
    analysis: GraphAnalysisResult | null
  ): GovernanceConfidenceScore {
    const factors: GovernanceConfidenceScore["factors"] = [];
    let value = 0.45;

    if (request.graphInput) {
      factors.push({
        key: "graph_input",
        label: "Upstream graph input present",
        contribution: 0.15,
      });
      value += 0.15;
    }
    if (analysis) {
      factors.push({
        key: "graph_analysis",
        label: "Executive graph analysis present",
        contribution: 0.12,
      });
      value += 0.12;
    }
    if (request.decisionResult) {
      factors.push({
        key: "decision",
        label: "Executive decision result present",
        contribution: 0.12,
      });
      value += 0.12;
    }
    if (request.predictionResult) {
      factors.push({
        key: "predictive",
        label: "Predictive intelligence present",
        contribution: 0.1,
      });
      value += 0.1;
    }
    if (
      request.initiatives?.length ||
      request.risks?.length ||
      request.complianceItems?.length
    ) {
      factors.push({
        key: "explicit_inputs",
        label: "Explicit governance inputs supplied",
        contribution: 0.08,
      });
      value += 0.08;
    }

    value = Math.min(0.95, value);
    return {
      value,
      level: levelFromValue(value),
      factors,
    };
  }
}

/** Alias matching Sprint 029 naming. */
export { BoardIntelligenceEngineImpl as BoardIntelligenceEngine };
