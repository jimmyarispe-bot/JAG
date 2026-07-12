/**
 * Organizational Memory (Sprint 040 / 0.2.0).
 *
 * Capture and preserve board/executive decisions, policies, SOPs, playbooks,
 * lessons learned, strategic initiatives, projects, meeting summaries,
 * best practices, failures, successes, experiments, and historical milestones.
 */

import type { OrganizationalMemoryEngine as OrganizationalMemoryEngineContract } from "@/lib/platform/intelligence/knowledge/contracts";
import {
  clamp,
  defaultCreateId,
  statusFromScore,
} from "@/lib/platform/intelligence/knowledge/models";
import type {
  KnowledgeBaseline,
  KnowledgeCatalogResult,
  KnowledgeProvenanceSuite,
  KnowledgeType,
  OrganizationalMemoryKind,
  OrganizationalMemoryRecord,
  OrganizationalMemorySuite,
} from "@/lib/platform/intelligence/knowledge/types";
import { ORGANIZATIONAL_MEMORY_KINDS } from "@/lib/platform/intelligence/knowledge/types";

const KIND_LABELS: Record<OrganizationalMemoryKind, string> = {
  board_decisions: "Board Decisions",
  executive_decisions: "Executive Decisions",
  policies: "Policies",
  sops: "SOPs",
  playbooks: "Playbooks",
  lessons_learned: "Lessons Learned",
  strategic_initiatives: "Strategic Initiatives",
  projects: "Projects",
  meeting_summaries: "Meeting Summaries",
  best_practices: "Best Practices",
  failures: "Failures",
  successes: "Successes",
  experiments: "Experiments",
  historical_milestones: "Historical Milestones",
};

const KIND_TO_TYPE: Partial<Record<OrganizationalMemoryKind, KnowledgeType>> = {
  board_decisions: "decisions",
  executive_decisions: "decisions",
  policies: "policies",
  sops: "procedures",
  playbooks: "playbooks",
  lessons_learned: "best_practices",
  strategic_initiatives: "strategies",
  projects: "historical_events",
  meeting_summaries: "institutional_memory",
  best_practices: "best_practices",
  failures: "risks",
  successes: "insights",
  experiments: "research",
  historical_milestones: "historical_events",
};

export class OrganizationalMemoryEngine
  implements OrganizationalMemoryEngineContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  capture(input: {
    baseline: KnowledgeBaseline;
    catalog: KnowledgeCatalogResult;
    provenance: KnowledgeProvenanceSuite;
    now: Date;
  }): OrganizationalMemorySuite {
    const records: OrganizationalMemoryRecord[] = ORGANIZATIONAL_MEMORY_KINDS.map(
      (kind) => {
        const linkedType = KIND_TO_TYPE[kind];
        const linked = input.catalog.artifacts.filter(
          (a) => a.type === linkedType
        );
        const score = resolveMemoryScore(kind, input.baseline);
        const relatedArtifactIds = linked.map((a) => a.id);
        return {
          id: this.createId(`know-mem-${kind}`),
          kind,
          title: `${KIND_LABELS[kind]} memory`,
          summary: `Preserved ${KIND_LABELS[kind].toLowerCase()} corpus with coverage ${Math.round(score)}.`,
          capturedAt: input.now.toISOString(),
          owner: linked[0]?.owner ?? "knowledge_steward",
          relatedArtifactIds,
          confidence: clamp(score),
          narrative: `${KIND_LABELS[kind]} ${statusFromScore(score)} at ${Math.round(score)}; linked artifacts ${relatedArtifactIds.length}.`,
        };
      }
    );

    const byKind = Object.fromEntries(
      records.map((r) => [r.kind, Math.max(1, Math.round(r.confidence / 20))])
    ) as Record<OrganizationalMemoryKind, number>;

    const coverageScore = clamp(
      records.reduce((s, r) => s + r.confidence, 0) / records.length
    );
    const weakest = [...records].sort((a, c) => a.confidence - c.confidence)[0]!;
    const leadershipTransitionReadiness = clamp(
      coverageScore * 0.45 +
        input.provenance.overallTrustScore * 0.25 +
        input.baseline.humanCapitalTransferScore * 0.2 +
        input.baseline.expertCoverage * 0.1
    );

    return {
      records,
      byKind,
      coverageScore,
      weakestKind: weakest.kind,
      leadershipTransitionReadiness,
      narrative: `Organizational memory coverage ${Math.round(coverageScore)}; weakest ${KIND_LABELS[weakest.kind]}; leadership transition readiness ${Math.round(leadershipTransitionReadiness)}.`,
    };
  }
}

function resolveMemoryScore(
  kind: OrganizationalMemoryKind,
  b: KnowledgeBaseline
): number {
  switch (kind) {
    case "board_decisions":
      return clamp(b.decisionDensity * 70 + b.policyCoverage * 0.35);
    case "executive_decisions":
      return clamp(b.decisionDensity * 85 + b.executionScore * 0.2);
    case "policies":
      return clamp(b.policyCoverage);
    case "sops":
      return clamp(b.procedureCoverage * 0.7 + b.operationsProcessDensity * 0.3);
    case "playbooks":
      return clamp(b.procedureCoverage * 0.55 + b.reuseScore * 0.45);
    case "lessons_learned":
      return clamp(b.reuseScore * 0.6 + b.customerInsightDensity * 0.4);
    case "strategic_initiatives":
      return clamp(b.executionScore * 0.6 + b.coverageScore * 0.4);
    case "projects":
      return clamp(b.coverageScore * 0.5 + (1 - b.staleRatio) * 50);
    case "meeting_summaries":
      return clamp(b.decisionDensity * 60 + b.connectivityScore * 0.4);
    case "best_practices":
      return clamp(b.reuseScore * 0.65 + b.trainingCoverage * 0.35);
    case "failures":
      return clamp((100 - b.conflictPressure * 100) * 0.45 + b.gapPressure * 40);
    case "successes":
      return clamp(b.customerInsightDensity * 0.5 + b.executionScore * 0.5);
    case "experiments":
      return clamp(b.reuseScore * 0.4 + b.customerInsightDensity * 0.6);
    case "historical_milestones":
      return clamp((1 - b.staleRatio) * 65 + b.coverageScore * 0.35);
  }
}
