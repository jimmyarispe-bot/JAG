/**
 * Sprint 063 — Executive Memory Intelligence engine.
 */

import {
  briefingArchiveFromResult,
  decisionsFromBriefing,
  initiativesFromDecisions,
  lessonFromOutcome,
  opportunitiesFromBriefing,
  outcomeFromDecision,
  risksFromBriefing,
} from "@/lib/platform/intelligence/executive-memory/entities";
import { MemoryGraph } from "@/lib/platform/intelligence/executive-memory/graph/memory-graph";
import { linkDecisionChain } from "@/lib/platform/intelligence/executive-memory/graph/relationships";
import { RetrievalEngine } from "@/lib/platform/intelligence/executive-memory/engine/retrieval-engine";
import {
  createDefaultMemoryRegistry,
  type ExecutiveMemoryRegistry,
} from "@/lib/platform/intelligence/executive-memory/registry";
import {
  activeEntities,
  applyRetention,
  DEFAULT_RETENTION_RULES,
} from "@/lib/platform/intelligence/executive-memory/retention/policies";
import { buildOrganizationalTimeline } from "@/lib/platform/intelligence/executive-memory/retrieval";
import type {
  BriefingMemory,
  DecisionMemory,
  ExecutiveMemoryRequest,
  ExecutiveMemoryResult,
  LessonMemory,
  MemoryRecallQuery,
  MemoryRecallResult,
  RetentionRule,
} from "@/lib/platform/intelligence/executive-memory/types";
import { EXECUTIVE_MEMORY_VERSION } from "@/lib/platform/intelligence/executive-memory/types";

export interface MemoryEngineDependencies {
  registry?: ExecutiveMemoryRegistry;
  graph?: MemoryGraph;
  createId?: (prefix: string) => string;
  now?: () => Date;
  retentionRules?: RetentionRule[];
}

let idSeq = 0;

function defaultCreateId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export class ExecutiveMemoryEngine {
  readonly graph: MemoryGraph;
  readonly registry: ExecutiveMemoryRegistry;
  readonly retrieval: RetrievalEngine;
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly retentionRules: RetentionRule[];

  constructor(deps: MemoryEngineDependencies = {}) {
    this.graph = deps.graph ?? new MemoryGraph();
    this.registry = deps.registry ?? createDefaultMemoryRegistry(deps.retentionRules);
    this.retrieval = new RetrievalEngine(this.graph);
    this.createId = deps.createId ?? defaultCreateId;
    this.now = deps.now ?? (() => new Date());
    this.retentionRules = deps.retentionRules ?? this.registry.listRetentionRules();
  }

  build(request: ExecutiveMemoryRequest): ExecutiveMemoryResult {
    const nowIso = this.now().toISOString();
    const rules = request.retentionRules?.length
      ? request.retentionRules
      : this.retentionRules.length
        ? this.retentionRules
        : DEFAULT_RETENTION_RULES;

    const decisions = decisionsFromBriefing(
      request.briefingResult,
      request.scope,
      nowIso,
      this.createId
    );
    const archiveEntity = briefingArchiveFromResult(
      request.briefingResult,
      request.scope,
      nowIso,
      this.createId,
      request.periodLabel
    );
    const risks = risksFromBriefing(
      request.briefingResult,
      request.scope,
      nowIso,
      this.createId
    );
    const opportunities = opportunitiesFromBriefing(
      request.briefingResult,
      request.scope,
      nowIso,
      this.createId
    );
    const initiatives = initiativesFromDecisions(
      decisions,
      request.scope,
      nowIso,
      this.createId
    );

    // Optional outcome/lesson generation when decisions carry actualOutcome
    const outcomes = [];
    const lessons: LessonMemory[] = [];
    const decisionCandidates: DecisionMemory[] = [
      ...decisions,
      ...((request.entities ?? []).filter((e): e is DecisionMemory => e.kind === "decision")),
    ];
    for (const d of decisionCandidates) {
      if (d.actualOutcome) {
        const outcome = outcomeFromDecision(d, d.actualOutcome, request.scope, nowIso, this.createId);
        outcomes.push(outcome);
        lessons.push(lessonFromOutcome(d, outcome, request.scope, nowIso, this.createId));
      }
    }

    const incoming = [
      ...(archiveEntity ? [archiveEntity] : []),
      ...decisions,
      ...risks,
      ...opportunities,
      ...initiatives,
      ...outcomes,
      ...lessons,
      ...(request.entities ?? []),
    ];

    const stored = incoming.map((e) => this.graph.upsertEntity(e));

    const briefingId = stored.find((e) => e.kind === "briefing")?.id;
    const rels = [
      ...linkDecisionChain({
        briefingId,
        decisions: stored.filter((e): e is DecisionMemory => e.kind === "decision"),
        initiatives: stored.filter((e) => e.kind === "initiative") as typeof initiatives,
        risks: stored.filter((e) => e.kind === "risk") as typeof risks,
        outcomes: stored.filter((e) => e.kind === "outcome") as typeof outcomes,
        lessons: stored.filter((e): e is LessonMemory => e.kind === "lesson"),
        nowIso,
        createId: this.createId,
      }),
      ...(request.relationships ?? []),
    ];
    for (const rel of rels) this.graph.addRelationship(rel);

    const withRetention = applyRetention(this.graph.listEntities(), rules, this.now());
    for (const e of withRetention) this.graph.upsertEntity(e);

    const active = activeEntities(this.graph.listEntities());
    const timeline = buildOrganizationalTimeline(active);
    const archive = active.filter((e): e is BriefingMemory => e.kind === "briefing");
    const decisionMemories = active.filter((e): e is DecisionMemory => e.kind === "decision");
    const lessonMemories = active.filter((e): e is LessonMemory => e.kind === "lesson");

    const healthValue = active.length
      ? Math.min(
          100,
          55 + decisionMemories.length * 5 + archive.length * 3 + lessonMemories.length * 4
        )
      : 20;

    return {
      requestId: request.requestId,
      version: EXECUTIVE_MEMORY_VERSION,
      scope: request.scope,
      generatedAt: nowIso,
      healthScore: {
        value: healthValue,
        label:
          active.length === 0
            ? "sparse"
            : healthValue >= 70
              ? "growing"
              : healthValue >= 45
                ? "forming"
                : "sparse",
      },
      stored: active,
      relationships: this.graph.listRelationships(),
      timeline,
      lessons: lessonMemories,
      archive,
      decisions: decisionMemories,
      retentionApplied: rules,
      contributingDomains: [
        ...new Set([
          ...(request.briefingResult?.contributingDomains ?? []),
          ...active.flatMap((e) => e.domains),
        ]),
      ],
      metadata: {
        pipeline: "executive-memory",
        entityCount: active.length,
        relationshipCount: this.graph.listRelationships().length,
        ...(request.metadata ?? {}),
      },
    };
  }

  recall(query: MemoryRecallQuery): MemoryRecallResult {
    return this.retrieval.recall(query);
  }
}

export function resetExecutiveMemoryIdSeqForTests(): void {
  idSeq = 0;
}
