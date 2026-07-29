/**
 * Education Intelligence Graph — coordinates contributor results.
 *
 * Contributors remain independent. The graph consumes their results only:
 * evidence, recommendations, action proposals, traces — never raw domain objects.
 */

import type { EducationContributorResult } from "../framework";
import type {
  EducationGraphContext,
  EducationGraphContributorInput,
} from "./EducationGraphContext";
import { aggregateEducationGraph } from "./EducationGraphAggregator";
import type { EducationGraphResult } from "./EducationGraphResult";
import {
  nodeKindFromContributorId,
  type EducationGraphNodeKind,
} from "./EducationGraphNode";
import type { EducationGraphEdge } from "./EducationGraphEdge";

export interface EducationIntelligenceGraphOptions {
  edges?: readonly EducationGraphEdge[];
}

export interface EducationIntelligenceGraph {
  /**
   * Coordinate contributor results into one unified Education result.
   * Does not invoke contributors — hosts pass precomputed results.
   */
  evaluate(context: EducationGraphContext): EducationGraphResult;

  /** Convenience: wrap contributor results with inferred node kinds. */
  evaluateResults(
    results: ReadonlyArray<{
      contributorId: string;
      result: EducationContributorResult;
      nodeKind?: EducationGraphNodeKind;
    }>,
    options?: {
      subjectId?: string;
      organizationId?: string;
      now?: string;
    }
  ): EducationGraphResult;
}

export function createEducationIntelligenceGraph(
  options: EducationIntelligenceGraphOptions = {}
): EducationIntelligenceGraph {
  return {
    evaluate(context) {
      return aggregateEducationGraph({
        ...context,
        edges: context.edges ?? options.edges,
      });
    },
    evaluateResults(results, runOptions = {}) {
      const inputs: EducationGraphContributorInput[] = results.map((r) => ({
        contributorId: r.contributorId,
        nodeKind:
          r.nodeKind ??
          nodeKindFromContributorId(r.contributorId) ??
          undefined,
        result: r.result,
      }));
      return aggregateEducationGraph({
        subjectId: runOptions.subjectId,
        organizationId: runOptions.organizationId,
        now: runOptions.now,
        inputs,
        edges: options.edges,
      });
    },
  };
}

/** One-shot helper. */
export function evaluateEducationIntelligenceGraph(
  context: EducationGraphContext
): EducationGraphResult {
  return createEducationIntelligenceGraph().evaluate(context);
}
