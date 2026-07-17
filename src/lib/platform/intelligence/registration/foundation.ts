/**
 * Foundation stack registration: graph → decision → predictive → board → DNA → OIOS.
 */

import {
  createExecutiveDecisionIntelligence,
  type ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import {
  createExecutiveGraphAnalyzer,
  type ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";
import {
  createPredictiveIntelligence,
  type PredictiveIntelligenceStack,
} from "@/lib/platform/intelligence/predictive-intelligence";
import {
  createBoardGovernanceIntelligence,
  type BoardGovernanceStack,
} from "@/lib/platform/intelligence/board-governance";
import {
  createOrganizationDnaIntelligence,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import {
  createOiosOperatingSystem,
  type OiosStack,
} from "@/lib/platform/oios";
import type { CreateIntelligenceServiceOptions } from "@/lib/platform/intelligence/registration/options";

export interface FoundationStacks {
  executiveGraphAnalyzer: ExecutiveGraphAnalyzerStack;
  executiveDecision: ExecutiveDecisionStack;
  predictiveIntelligence: PredictiveIntelligenceStack;
  boardGovernance: BoardGovernanceStack;
  organizationDna: OrganizationDnaStack;
  oios: OiosStack;
}

export function registerFoundationStacks(
  options: CreateIntelligenceServiceOptions
): FoundationStacks {
  const executiveGraphAnalyzer =
    options.executiveGraphAnalyzer ??
    createExecutiveGraphAnalyzer(options.executiveGraphAnalyzerOptions ?? {});
  const executiveDecision =
    options.executiveDecision ??
    createExecutiveDecisionIntelligence({
      ...(options.executiveDecisionOptions ?? {}),
      graphAnalyzer:
        options.executiveDecisionOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
    });
  const predictiveIntelligence =
    options.predictiveIntelligence ??
    createPredictiveIntelligence({
      ...(options.predictiveIntelligenceOptions ?? {}),
      graphAnalyzer:
        options.predictiveIntelligenceOptions?.graphAnalyzer ??
        executiveGraphAnalyzer,
      decision:
        options.predictiveIntelligenceOptions?.decision ?? executiveDecision,
      wireGraphAnalyzer: false,
      wireDecision: false,
    });
  const boardGovernance =
    options.boardGovernance ??
    createBoardGovernanceIntelligence({
      ...(options.boardGovernanceOptions ?? {}),
      graphAnalyzer:
        options.boardGovernanceOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
      decision:
        options.boardGovernanceOptions?.decision ?? executiveDecision,
      predictive:
        options.boardGovernanceOptions?.predictive ?? predictiveIntelligence,
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
    });
  const organizationDna =
    options.organizationDna ??
    createOrganizationDnaIntelligence({
      ...(options.organizationDnaOptions ?? {}),
      graphAnalyzer:
        options.organizationDnaOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
      decision:
        options.organizationDnaOptions?.decision ?? executiveDecision,
      predictive:
        options.organizationDnaOptions?.predictive ?? predictiveIntelligence,
      boardGovernance:
        options.organizationDnaOptions?.boardGovernance ?? boardGovernance,
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
      wireBoardGovernance: false,
    });
  const oios =
    options.oios ??
    createOiosOperatingSystem({
      ...(options.oiosOptions ?? {}),
      organizationDnaStack:
        options.oiosOptions?.organizationDnaStack ?? organizationDna,
      wireOrganizationDna: false,
    });

  return {
    executiveGraphAnalyzer,
    executiveDecision,
    predictiveIntelligence,
    boardGovernance,
    organizationDna,
    oios,
  };
}
