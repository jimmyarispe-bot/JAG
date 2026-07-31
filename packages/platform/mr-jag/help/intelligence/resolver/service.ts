/**
 * Resolver — diagnose → recommend → open incident → optional capture.
 */

import { randomUUID } from "node:crypto";
import { adaptAnswerTone } from "../../../personas";
import { recordQuestion } from "../../../store";
import { gatherDiagnostics } from "../diagnostics/gather";
import {
  listIncidents,
  upsertIncident,
} from "../incident-history/store";
import { captureResolution, listKnowledgeBase } from "../knowledge-capture/capture";
import { buildRecommendations } from "../recommendations/engine";
import { analyzeRootCause } from "../root-cause/engine";
import type {
  HelpIncident,
  IntelligentHelpDashboard,
  IntelligentHelpResult,
} from "../types";

export class MrJagIntelligentHelpService {
  diagnose(input: {
    question: string;
    organizationId: string;
    userId: string;
    persona?: string | null;
    role?: string | null;
    root?: string;
    includeGraph?: boolean;
  }): IntelligentHelpResult {
    const diagnostics = gatherDiagnostics({
      question: input.question,
      persona: input.persona,
      root: input.root,
      organizationId: input.organizationId,
      role: input.role,
      includeGraph: input.includeGraph,
    });
    const diagnosis = analyzeRootCause({ diagnostics });
    const recommendations = buildRecommendations(diagnosis);

    const now = new Date().toISOString();
    const incident: HelpIncident = {
      id: `inc:${randomUUID()}`,
      organizationId: input.organizationId,
      userId: input.userId,
      question: input.question,
      persona: diagnostics.persona,
      status: "Diagnosed",
      diagnosis,
      resolution: null,
      createdAt: now,
      updatedAt: now,
      verifiedAt: null,
      knowledgeEntryId: null,
    };
    upsertIncident(incident);
    recordQuestion({ userId: input.userId, question: input.question });

    const answer = adaptAnswerTone(
      diagnostics.persona,
      [
        `**Problem:** ${diagnosis.problem}`,
        `**Root cause:** ${diagnosis.rootCause}`,
        `**Confidence:** ${diagnosis.confidence}`,
        `**Recommended fix:** ${diagnosis.recommendedFix}`,
        diagnosis.evidence.length
          ? `**Evidence:** ${diagnosis.evidence
              .slice(0, 3)
              .map((e) => e.title)
              .join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    );

    return {
      diagnosis,
      diagnostics,
      incident,
      recommendations,
      answer,
      generatedAt: now,
    };
  }

  resolve(input: {
    incidentId: string;
    resolution?: string;
    verified?: boolean;
  }) {
    return captureResolution({
      incidentId: input.incidentId,
      resolution: input.resolution ?? "",
      verified: input.verified,
    });
  }

  listIncidents(organizationId: string, limit = 20) {
    return listIncidents({ organizationId, limit });
  }

  dashboard(organizationId: string): IntelligentHelpDashboard {
    const recent = listIncidents({ organizationId, limit: 12 });
    const kb = listKnowledgeBase(20).filter((k) => k.verified);
    const causeCounts = new Map<string, number>();
    for (const i of recent) {
      const cause = i.diagnosis?.rootCause;
      if (!cause) continue;
      causeCounts.set(cause, (causeCounts.get(cause) ?? 0) + 1);
    }
    for (const k of kb) {
      causeCounts.set(k.cause, (causeCounts.get(k.cause) ?? 0) + 1);
    }
    const topRootCauses = [...causeCounts.entries()]
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count || a.cause.localeCompare(b.cause))
      .slice(0, 8);

    const suggestedFixes = Object.freeze([
      ...new Set(
        [
          ...recent
            .map((i) => i.diagnosis?.recommendedFix)
            .filter((x): x is string => Boolean(x)),
          ...kb.map((k) => k.resolution),
        ].slice(0, 10)
      ),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      recentIssues: recent,
      suggestedFixes,
      frequentlySolved: Object.freeze(kb.slice(0, 8)),
      topRootCauses: Object.freeze(topRootCauses),
    };
  }
}

export function createMrJagIntelligentHelpService(): MrJagIntelligentHelpService {
  return new MrJagIntelligentHelpService();
}
