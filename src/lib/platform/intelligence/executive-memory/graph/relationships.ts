import type {
  DecisionMemory,
  InitiativeMemory,
  LessonMemory,
  MemoryRelationship,
  OutcomeMemory,
  RiskMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export function linkDecisionChain(input: {
  briefingId?: string;
  decisions: DecisionMemory[];
  initiatives: InitiativeMemory[];
  risks: RiskMemory[];
  outcomes: OutcomeMemory[];
  lessons: LessonMemory[];
  nowIso: string;
  createId: (prefix: string) => string;
}): MemoryRelationship[] {
  const rels: MemoryRelationship[] = [];
  const { createId, nowIso } = input;

  for (const d of input.decisions) {
    if (input.briefingId) {
      rels.push({
        id: createId("rel"),
        fromId: input.briefingId,
        toId: d.id,
        kind: "led_to",
        createdAt: nowIso,
      });
    }
    for (const r of input.risks) {
      if (r.domains.some((dom) => d.domains.includes(dom))) {
        rels.push({
          id: createId("rel"),
          fromId: r.id,
          toId: d.id,
          kind: "led_to",
          createdAt: nowIso,
          weight: 0.7,
        });
      }
    }
  }

  for (const init of input.initiatives) {
    for (const decisionId of init.relatedDecisionIds) {
      rels.push({
        id: createId("rel"),
        fromId: decisionId,
        toId: init.id,
        kind: "led_to",
        createdAt: nowIso,
      });
    }
  }

  for (const o of input.outcomes) {
    if (o.relatedDecisionId) {
      rels.push({
        id: createId("rel"),
        fromId: o.relatedDecisionId,
        toId: o.id,
        kind: "realizes",
        createdAt: nowIso,
      });
    }
  }

  for (const lesson of input.lessons) {
    for (const src of lesson.sourceIds) {
      rels.push({
        id: createId("rel"),
        fromId: src,
        toId: lesson.id,
        kind: "derived_from",
        createdAt: nowIso,
      });
    }
  }

  return rels;
}
