import type {
  ExecutiveDecisionConfidence,
  ExecutiveDecisionSeverity,
  ExecutiveDecisionType,
} from "@/lib/platform/executive-decisions/types";
import { DECISION_SEVERITY_RANK } from "@/lib/platform/executive-decisions/types";
import { clampPriority } from "@/lib/platform/executive-alerts/score";

const TYPE_WEIGHT: Record<ExecutiveDecisionType, number> = {
  Escalation: 10,
  Exception: 9,
  Compliance: 9,
  Financial: 8,
  Approval: 7,
  Staffing: 6,
  Admissions: 6,
  Operations: 5,
  Strategic: 5,
  Review: 3,
};

const CONFIDENCE_WEIGHT: Record<ExecutiveDecisionConfidence, number> = {
  High: 6,
  Medium: 3,
  Low: 0,
  Unknown: -3,
};

/**
 * Priority model (1–100). Favors:
 * Critical severity, blocking, financial / student / compliance impact,
 * multi-source corroboration, and age.
 */
export function scoreDecision(input: {
  severity: ExecutiveDecisionSeverity;
  decisionType: ExecutiveDecisionType;
  confidence: ExecutiveDecisionConfidence;
  blocking?: boolean;
  financialImpact?: boolean;
  studentImpact?: boolean;
  complianceRisk?: boolean;
  sourceCount?: number;
  createdAt?: string | null;
  dueDate?: string | null;
  now?: Date;
}): number {
  const severityBase: Record<ExecutiveDecisionSeverity, number> = {
    Critical: 82,
    High: 62,
    Medium: 38,
    Low: 22,
  };

  let score =
    severityBase[input.severity] +
    TYPE_WEIGHT[input.decisionType] +
    CONFIDENCE_WEIGHT[input.confidence];

  if (input.blocking) score += 12;
  if (input.financialImpact) score += 8;
  if (input.studentImpact) score += 8;
  if (input.complianceRisk) score += 8;

  const sourceCount = input.sourceCount ?? 1;
  if (sourceCount > 1) {
    score += Math.min(10, (sourceCount - 1) * 3);
  }

  const now = input.now ?? new Date();

  if (input.createdAt) {
    const ageMs = now.getTime() - new Date(input.createdAt).getTime();
    if (Number.isFinite(ageMs) && ageMs > 0) {
      const ageDays = ageMs / 86_400_000;
      if (ageDays >= 7) score += 8;
      else if (ageDays >= 3) score += 4;
      else if (ageDays >= 1) score += 2;
    }
  }

  if (input.dueDate) {
    const dueMs = new Date(input.dueDate).getTime() - now.getTime();
    if (Number.isFinite(dueMs)) {
      if (dueMs < 0) score += 10; // overdue
      else if (dueMs < 86_400_000) score += 6; // due within 24h
      else if (dueMs < 3 * 86_400_000) score += 3;
    }
  }

  return clampPriority(score);
}

export function maxDecisionSeverity(
  a: ExecutiveDecisionSeverity,
  b: ExecutiveDecisionSeverity
): ExecutiveDecisionSeverity {
  return DECISION_SEVERITY_RANK[a] >= DECISION_SEVERITY_RANK[b] ? a : b;
}

export function maxDecisionConfidence(
  a: ExecutiveDecisionConfidence,
  b: ExecutiveDecisionConfidence
): ExecutiveDecisionConfidence {
  const rank: Record<ExecutiveDecisionConfidence, number> = {
    High: 4,
    Medium: 3,
    Low: 2,
    Unknown: 1,
  };
  return rank[a] >= rank[b] ? a : b;
}

export function normalizeDecisionSeverity(
  raw: string | null | undefined
): ExecutiveDecisionSeverity {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "critical" || s === "urgent" || s === "blocked") return "Critical";
  if (s === "high" || s === "error") return "High";
  if (s === "warning" || s === "medium" || s === "normal") return "Medium";
  if (s === "low" || s === "info") return "Low";
  return "Medium";
}
