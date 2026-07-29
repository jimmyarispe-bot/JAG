import type { ExperienceNextAction } from "./experience-types";

/**
 * Briefing model derived from cognition (when present) — never invented here.
 */
export interface ExperienceBriefing {
  briefingId: string;
  summary?: string;
  priorities: readonly ExperienceBriefingPriority[];
  unknownGaps: readonly string[];
  nextActions: readonly ExperienceNextAction[];
  evidenceRefs?: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ExperienceBriefingPriority {
  id: string;
  title?: string;
  rank?: number;
  actionId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/** Extract a briefing from an opaque cognitive brief bag. */
export function briefingFromCognition(
  cognition: Readonly<Record<string, unknown>> | undefined,
  nowIso: string
): ExperienceBriefing {
  const briefingId =
    typeof cognition?.briefId === "string"
      ? cognition.briefId
      : `brief_${nowIso}`;

  const summary =
    typeof cognition?.summary === "string" ? cognition.summary : undefined;

  const unknownGaps = Array.isArray(cognition?.unknownGaps)
    ? cognition.unknownGaps.filter((g): g is string => typeof g === "string")
    : summary
      ? []
      : ["No cognitive brief available"];

  const priorities: ExperienceBriefingPriority[] = [];
  if (Array.isArray(cognition?.priorities)) {
    for (const [index, item] of cognition.priorities.entries()) {
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        priorities.push({
          id: typeof row.id === "string" ? row.id : `priority_${index}`,
          title: typeof row.title === "string" ? row.title : undefined,
          rank: typeof row.rank === "number" ? row.rank : index,
          actionId:
            typeof row.actionCandidateId === "string"
              ? row.actionCandidateId
              : typeof row.actionId === "string"
                ? row.actionId
                : undefined,
        });
      }
    }
  }

  const nextActions: ExperienceNextAction[] = [];
  if (Array.isArray(cognition?.recommendations)) {
    for (const [index, item] of cognition.recommendations.entries()) {
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const actionId =
          typeof row.actionCandidateId === "string"
            ? row.actionCandidateId
            : typeof row.actionId === "string"
              ? row.actionId
              : undefined;
        if (!actionId) continue;
        nextActions.push({
          actionId,
          label: typeof row.title === "string" ? row.title : undefined,
          priority: index,
        });
      }
    }
  }

  for (const p of priorities) {
    if (p.actionId && !nextActions.some((a) => a.actionId === p.actionId)) {
      nextActions.push({
        actionId: p.actionId,
        label: p.title,
        priority: p.rank ?? 100,
      });
    }
  }

  return {
    briefingId,
    summary,
    priorities,
    unknownGaps,
    nextActions,
  };
}
