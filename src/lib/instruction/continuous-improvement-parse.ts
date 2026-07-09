export type LearnerEngagementLevel = "active" | "moderate" | "minimal" | "unknown";

export interface SessionImprovementCapture {
  sessionId: string;
  studentId: string;
  capturedAt: string;
  instructionalStrategies: string[];
  instructionalResources: string[];
  accommodations: string[];
  interventionsDelivered: string[];
  competencyOutcomes: {
    competencyKey: string | null;
    competencyTitle: string | null;
    masteryLevel: number | null;
    outcomeRecorded: boolean;
  };
  evidenceQuality: {
    score: number;
    artifactCount: number;
    assessmentCount: number;
    platformEvidenceCount: number;
    missing: string[];
  };
  teacherReflection: string | null;
  learnerEngagement: LearnerEngagementLevel;
  familyCommunicationOutcome: {
    parentRemindersPending: number;
    draftGenerated: boolean;
  };
}

export interface SessionImprovementAnalysis {
  whatWorked: string[];
  whatDidNot: string[];
  confidence: number;
  effectiveness: "strong" | "moderate" | "needs_improvement";
  repeatability: "high" | "medium" | "low";
  recommendations: {
    instructional: string[];
    interventions: string[];
    scheduling: string[];
    competencySequencing: string[];
    familyGuidance: string[];
    executiveReporting: string[];
  };
  ruleOutcomeKey?: string;
  explanation?: string;
}

export interface SessionImprovementLoopSnapshot {
  kind: "continuous_improvement";
  sessionId: string;
  studentId: string;
  recordedAt: string;
  capture: SessionImprovementCapture;
  analysis: SessionImprovementAnalysis;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Read teacher reflection and prior loop snapshot from delivery attachment_refs. */
export function parseImprovementAttachmentRefs(refs: unknown): {
  teacherReflection: string | null;
  learnerEngagement: LearnerEngagementLevel;
  loopSnapshot: SessionImprovementLoopSnapshot | null;
} {
  const list = Array.isArray(refs) ? refs : [];
  let teacherReflection: string | null = null;
  let learnerEngagement: LearnerEngagementLevel = "unknown";
  let loopSnapshot: SessionImprovementLoopSnapshot | null = null;

  for (const item of list) {
    if (!isRecord(item)) continue;
    if (item.kind === "teacher_reflection") {
      teacherReflection = typeof item.body === "string" ? item.body : null;
      const engagement = item.engagement;
      if (engagement === "active" || engagement === "moderate" || engagement === "minimal") {
        learnerEngagement = engagement;
      }
    }
    if (item.kind === "continuous_improvement" && typeof item.sessionId === "string") {
      loopSnapshot = item as unknown as SessionImprovementLoopSnapshot;
    }
  }

  return { teacherReflection, learnerEngagement, loopSnapshot };
}
