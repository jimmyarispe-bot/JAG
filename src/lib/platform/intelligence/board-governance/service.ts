/**
 * Board & Governance Intelligence — GovernanceService (Sprint 029).
 *
 * Public façade over BoardIntelligenceEngine with repository accessors.
 */

import type {
  BoardGovernanceDependencies,
  GovernanceRepository as GovernanceRepositoryContract,
  GovernanceService as GovernanceServiceContract,
} from "@/lib/platform/intelligence/board-governance/contracts";
import {
  BoardIntelligenceEngine as BoardIntelligenceEngineImpl,
  type BoardIntelligenceEngine,
} from "@/lib/platform/intelligence/board-governance/board-intelligence-engine";
import type {
  BoardPacket,
  BoardPacketKind,
  BoardQueryRequest,
  BoardQueryResult,
  GovernanceBaseline,
  GovernanceRequest,
  GovernanceResult,
  GraphScope,
} from "@/lib/platform/intelligence/board-governance/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

export interface GovernanceServiceDependencies
  extends BoardGovernanceDependencies {
  engine?: BoardIntelligenceEngine;
}

/**
 * GovernanceService — Sprint 029 service entry point.
 */
export class GovernanceServiceImpl implements GovernanceServiceContract {
  private readonly engine: BoardIntelligenceEngineImpl;

  constructor(dependencies: GovernanceServiceDependencies = {}) {
    this.engine =
      (dependencies.engine as BoardIntelligenceEngineImpl | undefined) ??
      new BoardIntelligenceEngineImpl(dependencies);
  }

  generate(request: GovernanceRequest): GovernanceResult {
    return this.engine.generate(request);
  }

  generatePacket(
    kind: BoardPacketKind,
    options: {
      graph?: Graph;
      analysis?: GraphAnalysisResult;
      graphInput?: GraphBuildInput;
      decisionResult?: ExecutiveDecisionResult;
      predictionResult?: PredictionResult;
      baselineOverrides?: Partial<GovernanceBaseline>;
      periodLabel?: string;
      scope?: GraphScope;
    } = {}
  ): BoardPacket {
    const result = this.engine.generate({
      requestId: `packet-${kind}`,
      packetKinds: [kind],
      graph: options.graph,
      analysis: options.analysis,
      graphInput: options.graphInput,
      decisionResult: options.decisionResult,
      predictionResult: options.predictionResult,
      baselineOverrides: options.baselineOverrides,
      periodLabel: options.periodLabel,
      scope: options.scope,
    });

    const packet = result.packets[0];
    if (packet) return packet;

    throw new Error(`Failed to generate board packet of kind ${kind}`);
  }

  query(
    result: GovernanceResult,
    request: BoardQueryRequest
  ): BoardQueryResult {
    return this.engine.queries.ask(result, request);
  }

  repository(): GovernanceRepositoryContract {
    return this.engine.repository;
  }
}

/** Alias matching Sprint 029 naming. */
export { GovernanceServiceImpl as GovernanceService };
