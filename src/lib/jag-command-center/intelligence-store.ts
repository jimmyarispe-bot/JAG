/**
 * Application-level store for Education intelligence results bound to the
 * Command Center. Not Core / Runtime / Domain SDK — UI session memory only.
 */

import type { EducationExecutionSnapshot } from "@/lib/domains/education";
import {
  EXECUTIVE_BRIEFING_CONTRIBUTOR_ID,
  SCHOOL_HEALTH_CONTRIBUTOR_ID,
  type EducationActionProposal,
  type EducationContributorResult,
  type SchoolHealthStance,
} from "@/lib/domains/education";

export type JagStoredSchoolHealth = {
  readonly organizationId: string;
  readonly capturedAt: string;
  readonly stance: SchoolHealthStance | string;
  readonly healthScore: number;
  readonly confidence: number;
  readonly riskLevel: string;
  readonly trend?: string;
  readonly primaryDrivers: readonly string[];
  readonly explanation: string;
};

export type JagStoredExecutiveBrief = {
  readonly organizationId: string;
  readonly capturedAt: string;
  readonly stance: string;
  readonly confidence: number;
  readonly summary: string;
  readonly strategicPriorities: readonly string[];
  readonly criticalRisks: readonly string[];
  readonly recommendedActions: readonly string[];
};

export type JagStoredExecutionDetail = {
  readonly evidence: EducationContributorResult["evidence"];
  readonly recommendations: EducationContributorResult["recommendations"];
  readonly blockingIssues: readonly string[];
  readonly warnings: readonly string[];
  readonly readiness: EducationContributorResult["readiness"];
  readonly attributes?: Readonly<Record<string, unknown>>;
  readonly dependsOn: readonly string[];
};

export type JagStoredExecution = {
  readonly id: string;
  readonly organizationId: string;
  readonly contributorId: string;
  readonly label: string;
  readonly confidence: number;
  readonly durationMs?: number;
  readonly resultSummary: string;
  readonly analyzedAt: string;
  readonly evidenceCount: number;
  readonly suggestedActions: readonly EducationActionProposal[];
  /** Full contributor payload for Decision Center detail views. */
  readonly detail?: JagStoredExecutionDetail;
};

type OrgBucket = {
  schoolHealth?: JagStoredSchoolHealth;
  executiveBrief?: JagStoredExecutiveBrief;
  executions: JagStoredExecution[];
};

const byOrg = new Map<string, OrgBucket>();

function bucket(organizationId: string): OrgBucket {
  let b = byOrg.get(organizationId);
  if (!b) {
    b = { executions: [] };
    byOrg.set(organizationId, b);
  }
  return b;
}

export function resetJagIntelligenceStoreForTests(): void {
  byOrg.clear();
}

export function getStoredSchoolHealth(
  organizationId: string
): JagStoredSchoolHealth | null {
  return bucket(organizationId).schoolHealth ?? null;
}

export function getStoredExecutiveBrief(
  organizationId: string
): JagStoredExecutiveBrief | null {
  return bucket(organizationId).executiveBrief ?? null;
}

export function listStoredExecutions(
  organizationId: string,
  limit = 12
): readonly JagStoredExecution[] {
  return bucket(organizationId).executions.slice(0, limit);
}

export function listStoredActionProposals(
  organizationId: string
): readonly {
  readonly execution: JagStoredExecution;
  readonly proposal: EducationActionProposal;
}[] {
  const out: {
    execution: JagStoredExecution;
    proposal: EducationActionProposal;
  }[] = [];
  for (const execution of bucket(organizationId).executions) {
    for (const proposal of execution.suggestedActions) {
      out.push({ execution, proposal });
    }
  }
  return out.sort((a, b) => a.proposal.priority - b.proposal.priority);
}

/**
 * Bind an Education execution snapshot into the Command Center store.
 * Call from orchestrator hosts / future run APIs — overview only reads.
 */
export function recordEducationExecutionSnapshot(
  snapshot: EducationExecutionSnapshot
): void {
  const organizationId = snapshot.organizationId ?? "unknown";
  const b = bucket(organizationId);
  const capturedAt = snapshot.capturedAt;

  const depByContributor = new Map(
    snapshot.plan.nodes.map((n) => [n.contributorId, n.dependsOn] as const)
  );

  const executions: JagStoredExecution[] = snapshot.contributorRecords
    .filter((r) => r.status === "executed" && r.result)
    .map((r) => {
      const result = r.result as EducationContributorResult;
      return toStoredExecution({
        id: `${snapshot.snapshotId}:${r.contributorId}`,
        organizationId,
        contributorId: r.contributorId,
        result,
        durationMs: r.durationMs,
        analyzedAtFallback: capturedAt,
        dependsOn: depByContributor.get(r.contributorId) ?? [],
      });
    });

  b.executions = [...executions, ...b.executions].slice(0, 50);

  const healthResult = snapshot.contributorResults.find(
    (r) => r.contributorId === SCHOOL_HEALTH_CONTRIBUTOR_ID
  )?.result;
  if (healthResult) {
    b.schoolHealth = projectSchoolHealth(
      organizationId,
      capturedAt,
      healthResult
    );
  }

  const briefResult = snapshot.contributorResults.find(
    (r) => r.contributorId === EXECUTIVE_BRIEFING_CONTRIBUTOR_ID
  )?.result;
  if (briefResult) {
    b.executiveBrief = projectExecutiveBrief(
      organizationId,
      capturedAt,
      briefResult
    );
  }
}

/** Direct bind for tests / hosts that already ran School Health. */
export function recordSchoolHealthResult(input: {
  organizationId: string;
  result: EducationContributorResult & {
    stance?: string;
    healthScore?: number;
  };
}): void {
  const b = bucket(input.organizationId);
  b.schoolHealth = projectSchoolHealth(
    input.organizationId,
    input.result.analyzedAt,
    input.result
  );
  b.executions = [
    toStoredExecution({
      id: `school-health:${input.result.analyzedAt}`,
      organizationId: input.organizationId,
      contributorId: SCHOOL_HEALTH_CONTRIBUTOR_ID,
      result: input.result,
      analyzedAtFallback: input.result.analyzedAt,
      dependsOn: [],
    }),
    ...b.executions,
  ].slice(0, 50);
}

export function recordExecutiveBriefResult(input: {
  organizationId: string;
  result: EducationContributorResult & {
    stance?: string;
    briefingConfidence?: number;
  };
}): void {
  const b = bucket(input.organizationId);
  b.executiveBrief = projectExecutiveBrief(
    input.organizationId,
    input.result.analyzedAt,
    input.result
  );
  b.executions = [
    toStoredExecution({
      id: `executive-brief:${input.result.analyzedAt}`,
      organizationId: input.organizationId,
      contributorId: EXECUTIVE_BRIEFING_CONTRIBUTOR_ID,
      result: input.result,
      analyzedAtFallback: input.result.analyzedAt,
      dependsOn: [],
    }),
    ...b.executions,
  ].slice(0, 50);
}

export function getStoredExecution(
  organizationId: string,
  executionId: string
): JagStoredExecution | null {
  return (
    bucket(organizationId).executions.find((e) => e.id === executionId) ?? null
  );
}

export function listStoredExecutionsForOrganizations(
  organizationIds: readonly string[],
  limit = 200
): readonly JagStoredExecution[] {
  const out: JagStoredExecution[] = [];
  for (const organizationId of organizationIds) {
    out.push(...bucket(organizationId).executions);
  }
  return out
    .slice()
    .sort((a, b) => b.analyzedAt.localeCompare(a.analyzedAt))
    .slice(0, limit);
}

function toStoredExecution(input: {
  id: string;
  organizationId: string;
  contributorId: string;
  result: EducationContributorResult;
  durationMs?: number;
  analyzedAtFallback: string;
  dependsOn: readonly string[];
}): JagStoredExecution {
  const suggestedActions = dedupeProposals([
    ...input.result.suggestedActions,
    ...input.result.recommendations.flatMap((rec) => rec.suggestedActions),
  ]);
  return {
    id: input.id,
    organizationId: input.organizationId,
    contributorId: input.contributorId,
    label: labelForContributor(input.contributorId),
    confidence: input.result.confidence,
    durationMs: input.durationMs,
    resultSummary: input.result.explanation || input.result.readiness,
    analyzedAt: input.result.analyzedAt || input.analyzedAtFallback,
    evidenceCount: input.result.evidence.length,
    suggestedActions,
    detail: {
      evidence: input.result.evidence,
      recommendations: input.result.recommendations,
      blockingIssues: input.result.blockingIssues,
      warnings: input.result.warnings,
      readiness: input.result.readiness,
      attributes: input.result.attributes,
      dependsOn: input.dependsOn,
    },
  };
}

function dedupeProposals(
  proposals: readonly EducationActionProposal[]
): EducationActionProposal[] {
  const seen = new Set<string>();
  const out: EducationActionProposal[] = [];
  for (const p of proposals) {
    if (seen.has(p.actionId)) continue;
    seen.add(p.actionId);
    out.push(p);
  }
  return out;
}

function projectSchoolHealth(
  organizationId: string,
  capturedAt: string,
  result: EducationContributorResult & {
    stance?: string;
    healthScore?: number;
  }
): JagStoredSchoolHealth {
  const stance =
    (typeof result.stance === "string" && result.stance) ||
    (typeof result.attributes?.stance === "string"
      ? result.attributes.stance
      : undefined) ||
    result.readiness;
  const healthScore =
    typeof result.healthScore === "number"
      ? result.healthScore
      : typeof result.attributes?.healthScore === "number"
        ? result.attributes.healthScore
        : result.confidence;

  const drivers = [
    ...result.blockingIssues,
    ...result.warnings,
    ...result.recommendations.slice(0, 3).map((r) => r.title),
  ].filter(Boolean);

  const trend =
    typeof result.attributes?.trend === "string"
      ? result.attributes.trend
      : undefined;

  return {
    organizationId,
    capturedAt,
    stance,
    healthScore,
    confidence: result.confidence,
    riskLevel: riskFromStance(String(stance)),
    trend,
    primaryDrivers: drivers.slice(0, 6),
    explanation: result.explanation,
  };
}

function projectExecutiveBrief(
  organizationId: string,
  capturedAt: string,
  result: EducationContributorResult & {
    stance?: string;
    briefingConfidence?: number;
  }
): JagStoredExecutiveBrief {
  const summary =
    evidenceText(result, "executive_summary") || result.explanation;
  const strategicPriorities = evidenceTexts(result, "strategic_priorities");
  const criticalRisks = evidenceTexts(result, "critical_risks");
  const recommendedActions = result.recommendations.map((r) => r.title);

  return {
    organizationId,
    capturedAt,
    stance:
      (typeof result.stance === "string" && result.stance) ||
      result.readiness,
    confidence:
      typeof result.briefingConfidence === "number"
        ? result.briefingConfidence
        : result.confidence,
    summary,
    strategicPriorities,
    criticalRisks,
    recommendedActions,
  };
}

function evidenceText(
  result: EducationContributorResult,
  code: string
): string | undefined {
  const hit = result.evidence.find((e) => e.attributes?.code === code);
  if (!hit) return undefined;
  if (typeof hit.attributes?.summary === "string") return hit.attributes.summary;
  if (typeof hit.attributes?.message === "string") return hit.attributes.message;
  return undefined;
}

function evidenceTexts(
  result: EducationContributorResult,
  code: string
): string[] {
  return result.evidence
    .filter((e) => e.attributes?.code === code)
    .map((e) => {
      if (typeof e.attributes?.summary === "string") return e.attributes.summary;
      if (typeof e.attributes?.message === "string") return e.attributes.message;
      return "";
    })
    .filter(Boolean);
}

function riskFromStance(stance: string): string {
  switch (stance) {
    case "critical":
      return "Critical";
    case "at_risk":
    case "blocked":
      return "High";
    case "watch":
    case "conditional":
    case "cautionary":
    case "urgent":
      return "Elevated";
    case "healthy":
    case "ready":
    case "favorable":
      return "Low";
    default:
      return "Unknown";
  }
}

function labelForContributor(contributorId: string): string {
  const tail = contributorId.split(".").pop() ?? contributorId;
  return tail
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
