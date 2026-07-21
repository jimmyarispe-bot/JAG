/**
 * Sprint 063 — structured executive recall APIs.
 */

import type { MemoryGraph } from "@/lib/platform/intelligence/executive-memory/graph/memory-graph";
import {
  buildOrganizationalTimeline,
  filterEntities,
  graphTraversal,
} from "@/lib/platform/intelligence/executive-memory/retrieval";
import type {
  LessonMemory,
  MemoryRecallQuery,
  MemoryRecallResult,
  RiskMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export class RetrievalEngine {
  constructor(private readonly graph: MemoryGraph) {}

  recall(query: MemoryRecallQuery): MemoryRecallResult {
    const all = this.graph.listEntities();
    const entities = filterEntities(all, query);
    const entityIds = new Set(entities.map((e) => e.id));
    const relationships = this.graph
      .listRelationships()
      .filter((r) => entityIds.has(r.fromId) || entityIds.has(r.toId));
    const timeline = buildOrganizationalTimeline(entities);
    const lessons = entities.filter((e): e is LessonMemory => e.kind === "lesson");
    // Answer generation uses kind/domain filtered set (ignore free-text noise)
    const answerPool = filterEntities(all, {
      kinds: query.kinds,
      domains: query.domains,
      organizationId: query.organizationId,
      schoolId: query.schoolId,
      decisionId: query.decisionId,
      initiativeId: query.initiativeId,
      limit: 100,
    });
    const answers = buildAnswers(query, answerPool.length ? answerPool : entities, this.graph);

    return { query, entities, relationships, timeline, lessons, answers };
  }

  whenDidRiskFirstAppear(title: string): string | null {
    const risk = this.graph
      .listEntities()
      .find(
        (e): e is RiskMemory =>
          e.kind === "risk" && e.title.toLowerCase().includes(title.toLowerCase())
      );
    return risk?.firstSeenAt ?? null;
  }

  briefingsRelatedTo(topic: string) {
    return this.recall({ text: topic, kinds: ["briefing"] }).entities;
  }

  initiativesFromDecision(decisionId: string) {
    return this.recall({ decisionId, kinds: ["initiative"] }).entities;
  }

  recurrenceCount(title: string): number {
    const risk = this.graph
      .listEntities()
      .find(
        (e): e is RiskMemory =>
          e.kind === "risk" && e.title.toLowerCase() === title.toLowerCase()
      );
    return risk?.recurrenceCount ?? 0;
  }

  traverseFrom(entityId: string, maxDepth = 3) {
    return graphTraversal(this.graph, entityId, maxDepth);
  }
}

function buildAnswers(
  query: MemoryRecallQuery,
  entities: import("@/lib/platform/intelligence/executive-memory/types").MemoryEntity[],
  graph: MemoryGraph
): string[] {
  const answers: string[] = [];
  const text = query.text?.toLowerCase() ?? "";

  if (text.includes("when") && text.includes("risk")) {
    const risk = entities.find((e): e is RiskMemory => e.kind === "risk");
    if (risk) {
      answers.push(`Risk "${risk.title}" first appeared at ${risk.firstSeenAt}.`);
    }
  }
  if (text.includes("briefing") || text.includes("scholarship") || text.includes("funding")) {
    const briefs = entities.filter((e) => e.kind === "briefing");
    answers.push(
      briefs.length
        ? `Found ${briefs.length} briefing(s) matching the topic.`
        : "No briefings matched the topic."
    );
  }
  if (text.includes("initiative") && query.decisionId) {
    const inits = entities.filter((e) => e.kind === "initiative");
    answers.push(`${inits.length} initiative(s) linked to decision ${query.decisionId}.`);
  }
  if (text.includes("recur") || text.includes("how many")) {
    const risk = entities.find((e): e is RiskMemory => e.kind === "risk");
    if (risk) {
      answers.push(`Issue "${risk.title}" has recurred ${risk.recurrenceCount} time(s).`);
    }
  }
  if (!answers.length) {
    answers.push(
      entities.length
        ? `Retrieved ${entities.length} memory entit(ies) with ${graph.listRelationships().length} relationship(s) in store.`
        : "No matching executive memory found."
    );
  }
  return answers;
}
