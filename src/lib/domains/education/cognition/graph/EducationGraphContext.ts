/**
 * Graph run context — consumes contributor results only (no raw domain objects).
 */

import type { EducationContributorResult } from "../framework";
import type { EducationGraphEdge } from "./EducationGraphEdge";
import type { EducationGraphNodeKind } from "./EducationGraphNode";

export interface EducationGraphContributorInput {
  contributorId: string;
  /** Optional explicit node kind; inferred from contributorId when omitted. */
  nodeKind?: EducationGraphNodeKind;
  result: EducationContributorResult;
}

export interface EducationGraphContext {
  /** Optional unified subject (student / enrollment / org scope). */
  subjectId?: string;
  organizationId?: string;
  /** Independent contributor results to coordinate. */
  inputs: readonly EducationGraphContributorInput[];
  /** Influence edges; defaults to EDUCATION_DEFAULT_GRAPH_EDGES. */
  edges?: readonly EducationGraphEdge[];
  now?: string;
  attributes?: Readonly<Record<string, unknown>>;
}
