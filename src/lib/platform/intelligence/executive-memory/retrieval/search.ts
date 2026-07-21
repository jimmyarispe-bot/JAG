import type {
  DecisionMemory,
  InitiativeMemory,
  MeetingMemory,
  MemoryEntity,
  MemoryRecallQuery,
  OutcomeMemory,
} from "@/lib/platform/intelligence/executive-memory/types";

export function filterEntities(
  entities: MemoryEntity[],
  query: MemoryRecallQuery
): MemoryEntity[] {
  let result = [...entities];

  if (query.kinds?.length) {
    result = result.filter((e) => query.kinds!.includes(e.kind));
  }
  if (query.domains?.length) {
    result = result.filter((e) => e.domains.some((d) => query.domains!.includes(d)));
  }
  if (query.tags?.length) {
    result = result.filter((e) => e.tags.some((t) => query.tags!.includes(t)));
  }
  if (query.minConfidence != null) {
    result = result.filter((e) => e.confidence >= query.minConfidence!);
  }
  if (query.organizationId !== undefined) {
    result = result.filter((e) => e.scope.organizationId === query.organizationId);
  }
  if (query.schoolId !== undefined) {
    result = result.filter((e) => e.scope.schoolId === query.schoolId);
  }
  if (query.dateFrom) {
    result = result.filter((e) => e.createdAt >= query.dateFrom!);
  }
  if (query.dateTo) {
    result = result.filter((e) => e.createdAt <= query.dateTo!);
  }
  if (query.decisionId) {
    result = result.filter((e) => {
      if (e.id === query.decisionId || e.sourceIds.includes(query.decisionId!)) return true;
      if (e.kind === "initiative") {
        return (e as InitiativeMemory).relatedDecisionIds.includes(query.decisionId!);
      }
      if (e.kind === "outcome") {
        return (e as OutcomeMemory).relatedDecisionId === query.decisionId;
      }
      return false;
    });
  }
  if (query.initiativeId) {
    result = result.filter(
      (e) => e.id === query.initiativeId || e.sourceIds.includes(query.initiativeId!)
    );
  }
  if (query.person) {
    const p = query.person.toLowerCase();
    result = result.filter((e) => {
      if (e.kind === "decision") {
        return ((e as DecisionMemory).owner ?? "").toLowerCase().includes(p);
      }
      if (e.kind === "initiative") {
        return ((e as InitiativeMemory).owner ?? "").toLowerCase().includes(p);
      }
      if (e.kind === "meeting") {
        return (e as MeetingMemory).attendees.some((a: string) => a.toLowerCase().includes(p));
      }
      return e.summary.toLowerCase().includes(p) || e.title.toLowerCase().includes(p);
    });
  }
  if (query.topic || query.text) {
    const needle = (query.topic ?? query.text ?? "").toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        e.summary.toLowerCase().includes(needle) ||
        e.tags.some((t) => t.toLowerCase().includes(needle)) ||
        e.domains.some((d) => d.toLowerCase().includes(needle))
    );
  }

  result.sort((a, b) => b.confidence - a.confidence || b.updatedAt.localeCompare(a.updatedAt));
  return result.slice(0, query.limit ?? 50);
}
