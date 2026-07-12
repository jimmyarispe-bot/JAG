/**
 * Knowledge Intelligence — capture / artifact catalog (Sprint 040).
 *
 * Every artifact retains full provenance (source, author, owner, dates,
 * confidence/trust, version history, approval, related policies/decisions/goals/DNA).
 */

import type { KnowledgeCaptureEngine as KnowledgeCaptureEngineContract } from "@/lib/platform/intelligence/knowledge/contracts";
import {
  clamp,
  defaultCreateId,
  statusFromScore,
} from "@/lib/platform/intelligence/knowledge/models";
import type {
  KnowledgeArtifactRecord,
  KnowledgeApprovalStatus,
  KnowledgeBaseline,
  KnowledgeCatalogResult,
  KnowledgeProvenanceRecord,
  KnowledgeSource,
  KnowledgeSourceType,
  KnowledgeType,
  KnowledgeVersionEntry,
} from "@/lib/platform/intelligence/knowledge/types";
import { KNOWLEDGE_TYPES } from "@/lib/platform/intelligence/knowledge/types";

const TYPE_LABELS: Record<KnowledgeType, string> = {
  facts: "Facts",
  policies: "Policies",
  procedures: "Procedures",
  playbooks: "Playbooks",
  best_practices: "Best Practices",
  decisions: "Decisions",
  risks: "Risks",
  insights: "Insights",
  strategies: "Strategies",
  templates: "Templates",
  research: "Research",
  historical_events: "Historical Events",
  institutional_memory: "Institutional Memory",
};

const TYPE_SOURCE: Record<KnowledgeType, KnowledgeSource> = {
  facts: "organization_dna",
  policies: "policies",
  procedures: "procedures",
  playbooks: "sops",
  best_practices: "lessons_learned",
  decisions: "executive_decisions",
  risks: "board_meetings",
  insights: "customer",
  strategies: "organizational_improvement",
  templates: "training",
  research: "opportunity",
  historical_events: "projects",
  institutional_memory: "human_capital",
};

const TYPE_SOURCE_KIND: Record<KnowledgeType, KnowledgeSourceType> = {
  facts: "system",
  policies: "human",
  procedures: "human",
  playbooks: "human",
  best_practices: "derived",
  decisions: "human",
  risks: "human",
  insights: "inferred",
  strategies: "human",
  templates: "imported",
  research: "imported",
  historical_events: "system",
  institutional_memory: "derived",
};

export class KnowledgeCaptureEngine implements KnowledgeCaptureEngineContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  catalog(input: {
    baseline: KnowledgeBaseline;
    now: Date;
  }): KnowledgeCatalogResult {
    const b = input.baseline;
    const artifacts: KnowledgeArtifactRecord[] = KNOWLEDGE_TYPES.map((type) => {
      const score = resolveTypeScore(type, b);
      const count = Math.max(1, Math.round(score / 18));
      const owner = ownerFor(type);
      const source = TYPE_SOURCE[type];
      const validatedAt =
        score >= 60
          ? new Date(
              input.now.getTime() - Math.round(b.staleRatio * 90) * 86_400_000
            ).toISOString()
          : null;
      const version = Math.max(1, Math.round(score / 25));
      const creationDate = new Date(
        input.now.getTime() - Math.round((100 - score) * 2) * 86_400_000
      ).toISOString();
      const lastModifiedDate = new Date(
        input.now.getTime() - Math.round(b.staleRatio * 30) * 86_400_000
      ).toISOString();
      const confidence = clamp(score);
      const trustScore = clamp(
        confidence * 0.55 +
          b.provenanceScore * 0.25 +
          b.ownershipScore * 0.2
      );
      const provenance = buildProvenance({
        type,
        source,
        owner,
        creationDate,
        lastModifiedDate,
        validatedAt,
        confidence,
        trustScore,
        version,
        baseline: b,
      });

      return {
        id: this.createId(`know-${type}`),
        type,
        title: `${TYPE_LABELS[type]} corpus`,
        source,
        owner,
        validatedAt,
        confidence,
        version,
        dependents: Math.round(b.connectivityScore / 12 + count),
        decisionsInfluenced: Math.round(b.decisionDensity * 10 + count * 0.5),
        narrative: `${TYPE_LABELS[type]} coverage ${statusFromScore(score)} at ${Math.round(score)} (${count} artifacts).`,
        provenance,
      };
    });

    const byType = Object.fromEntries(
      KNOWLEDGE_TYPES.map((type) => [
        type,
        Math.max(1, Math.round(resolveTypeScore(type, b) / 18)),
      ])
    ) as Record<KnowledgeType, number>;

    const overallCoverage = clamp(
      artifacts.reduce((sum, a) => sum + a.confidence, 0) / artifacts.length
    );
    const weakest = [...artifacts].sort((a, c) => a.confidence - c.confidence)[0]!;

    return {
      artifacts,
      byType,
      overallCoverage,
      weakestType: weakest.type,
      narrative: `Knowledge catalog coverage ${Math.round(overallCoverage)}; weakest type ${TYPE_LABELS[weakest.type]}.`,
    };
  }
}

function buildProvenance(input: {
  type: KnowledgeType;
  source: KnowledgeSource;
  owner: string;
  creationDate: string;
  lastModifiedDate: string;
  validatedAt: string | null;
  confidence: number;
  trustScore: number;
  version: number;
  baseline: KnowledgeBaseline;
}): KnowledgeProvenanceRecord {
  const author = authorFor(input.type);
  const versionHistory: KnowledgeVersionEntry[] = Array.from(
    { length: input.version },
    (_, i) => ({
      version: i + 1,
      changedAt:
        i === input.version - 1
          ? input.lastModifiedDate
          : input.creationDate,
      changedBy: i === 0 ? author : input.owner,
      summary:
        i === 0
          ? `Initial capture of ${TYPE_LABELS[input.type]}`
          : `Revision ${i + 1} of ${TYPE_LABELS[input.type]}`,
    })
  );

  return {
    source: input.source,
    sourceType: TYPE_SOURCE_KIND[input.type],
    originalAuthor: author,
    currentOwner: input.owner,
    creationDate: input.creationDate,
    lastModifiedDate: input.lastModifiedDate,
    lastValidationDate: input.validatedAt,
    confidenceScore: input.confidence,
    trustScore: input.trustScore,
    versionHistory,
    approvalStatus: approvalFor(input.confidence, input.validatedAt),
    relatedPolicies:
      input.type === "policies" || input.type === "procedures"
        ? [`policy-${input.type}-core`]
        : input.baseline.policyCoverage >= 60
          ? ["policy-governance-core"]
          : [],
    relatedDecisions:
      input.type === "decisions" || input.baseline.decisionDensity >= 0.4
        ? [`decision-${input.type}-linked`]
        : [],
    relatedGoals:
      input.type === "strategies" || input.type === "insights"
        ? [`goal-${input.type}-alignment`]
        : [],
    relatedOrganizationalDna:
      input.source === "organization_dna" || input.type === "facts"
        ? ["dna-persona", "dna-structure"]
        : input.baseline.coverageScore >= 65
          ? ["dna-structure"]
          : [],
  };
}

function approvalFor(
  confidence: number,
  validatedAt: string | null
): KnowledgeApprovalStatus {
  if (confidence >= 75 && validatedAt) return "approved";
  if (confidence >= 60) return "pending_review";
  if (confidence >= 40) return "draft";
  return "expired";
}

function authorFor(type: KnowledgeType): string {
  switch (type) {
    case "policies":
    case "risks":
      return "board_secretary";
    case "decisions":
    case "strategies":
      return "executive_office";
    case "procedures":
    case "playbooks":
      return "operations_lead";
    case "insights":
    case "best_practices":
      return "cx_analyst";
    case "institutional_memory":
    case "templates":
      return "people_ops";
    default:
      return "knowledge_steward";
  }
}

function ownerFor(type: KnowledgeType): string {
  switch (type) {
    case "policies":
    case "risks":
    case "strategies":
      return "governance";
    case "procedures":
    case "playbooks":
      return "operations";
    case "insights":
    case "best_practices":
      return "customer_experience";
    case "institutional_memory":
    case "research":
    case "templates":
      return "people";
    default:
      return "executive";
  }
}

function resolveTypeScore(type: KnowledgeType, b: KnowledgeBaseline): number {
  switch (type) {
    case "facts":
      return clamp(b.coverageScore * 0.6 + b.organizationHealthScore * 0.4);
    case "policies":
      return clamp(b.policyCoverage);
    case "procedures":
      return clamp(b.procedureCoverage);
    case "playbooks":
      return clamp(b.procedureCoverage * 0.55 + b.operationsProcessDensity * 0.45);
    case "best_practices":
      return clamp(b.reuseScore * 0.6 + b.customerInsightDensity * 0.4);
    case "decisions":
      return clamp(b.decisionDensity * 80 + b.executionScore * 0.25);
    case "risks":
      return clamp(
        (100 - b.conflictPressure * 100) * 0.5 + b.organizationHealthScore * 0.5
      );
    case "insights":
      return clamp(b.customerInsightDensity);
    case "strategies":
      return clamp(b.executionScore * 0.55 + b.coverageScore * 0.45);
    case "templates":
      return clamp(b.trainingCoverage * 0.6 + b.reuseScore * 0.4);
    case "research":
      return clamp(b.reuseScore * 0.5 + b.customerInsightDensity * 0.5);
    case "historical_events":
      return clamp((1 - b.staleRatio) * 70 + b.coverageScore * 0.3);
    case "institutional_memory":
      return clamp(b.humanCapitalTransferScore * 0.55 + b.expertCoverage * 0.45);
  }
}
