import type { IdentityContext } from "@/lib/platform/identity/context";
import type { RuntimeRecommendation } from "@/lib/platform/execution-engine/types";
import type { PlatformEvidenceRecord } from "@/lib/platform/evidence/types";
import type { StudentReadinessSnapshot } from "@/lib/instruction/readiness";
import type {
  PajCompetencyProgressRecord,
  PajJourneySnapshot,
  PajRecommendationSnapshot,
} from "@/lib/platform/paj/types";
import type { UlrCompetencyDefinition } from "@/lib/platform/ulr/types";

export type JagProfileSection = "identity" | "learning" | "instruction" | "evidence" | "readiness" | "ai";

export interface JagProfilePrerequisiteItem {
  competencyKey: string;
  title: string;
  met: boolean;
}

export interface JagProfileIdentity {
  studentId: string;
  displayName: string;
  preferredName: string | null;
  demographics: {
    dateOfBirth: string | null;
    gradeLevel: string | null;
    gender: string | null;
    studentNumber: string | null;
    photoUrl: string | null;
  };
  enrollment: {
    status: string;
    program: string | null;
    lifecycleStage: string | null;
    graduationYear: number | null;
    sisEnrollments: { program: string; status: string; schoolYear?: string | null }[];
    courseSections: { sectionCode?: string; courseName?: string; status: string }[];
  };
  family: {
    familyId: string | null;
    familyName: string | null;
    guardians: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      relationship: string | null;
      isPrimary: boolean;
    }[];
  };
  campuses: {
    schoolId: string;
    schoolName: string | null;
    campusName: string | null;
  };
  permissions: string[];
}

export interface JagProfileLearning {
  journey: PajJourneySnapshot | null;
  activeCompetency: UlrCompetencyDefinition | null;
  activeCompetencyProgress: PajCompetencyProgressRecord | null;
  competencyHistory: {
    competencyKey: string;
    title: string;
    masteryLevel: number;
    status: string;
  }[];
  masterySummary: {
    proficientCount: number;
    inProgressCount: number;
    totalTracked: number;
  };
  prerequisiteGraph: JagProfilePrerequisiteItem[];
  prerequisiteStatus: { ok: boolean; missing: string[] };
}

export interface JagProfileInstruction {
  engineRecommendations: RuntimeRecommendation[];
  pajRecommendations: PajRecommendationSnapshot | null;
  strategies: string[];
  accommodations: string[];
  activeInterventions: { id: string; type: string; goal?: string | null }[];
  lessonHistory: {
    sessionId: string;
    courseName: string;
    sectionCode: string;
    scheduledAt: string;
    status: string;
  }[];
  parentReminders: { subject: string; status: string }[];
}

export interface JagProfileEvidence {
  observations: {
    id: string;
    title: string;
    body: string;
    category: string | null;
    createdAt: string;
  }[];
  artifacts: Record<string, unknown>[];
  assessments: Record<string, unknown>[];
  keeEvidence: PlatformEvidenceRecord[];
  competencyEvidence: PlatformEvidenceRecord[];
}

export interface JagProfileReadiness {
  operational: StudentReadinessSnapshot;
  graduationReadiness: {
    score: number;
    ready: boolean;
    ruleOutcomeKey?: string;
    explanation?: string;
  };
  transitionReadiness: {
    score: number;
    ready: boolean;
    explanation?: string;
  };
  riskIndicators: {
    level: "low" | "medium" | "high";
    signals: string[];
    successScore?: number;
    statusIndicator?: "green" | "yellow" | "red";
  };
  attendanceSummary: {
    presentCount: number;
    totalRecent: number;
    ratePercent: number;
  };
  executiveSummaries: string[];
}

export interface JagProfileAiRecommendation {
  source: "execution_engine" | "paj" | "rules" | "ulr";
  title: string;
  rationale: string;
  priority?: "high" | "medium" | "low";
  confidence?: number;
  outcomeKey?: string;
}

export interface JagProfileAi {
  recommendations: JagProfileAiRecommendation[];
  confidence: number;
  explanations: string[];
  supportingEvidence: { label: string; ref: string }[];
}

/** Canonical JAG Profile™ — single learner aggregation consumed by all workspaces. */
export interface JagProfile {
  studentId: string;
  resolvedAt: string;
  identity: JagProfileIdentity;
  learning: JagProfileLearning;
  instruction: JagProfileInstruction;
  evidence: JagProfileEvidence;
  readiness: JagProfileReadiness;
  ai: JagProfileAi;
}

export interface ResolveJagProfileOptions {
  identity?: IdentityContext;
  employeeId?: string;
  sessionId?: string;
  workspaceKey?: string;
  activeView?: string;
  sections?: JagProfileSection[];
}
