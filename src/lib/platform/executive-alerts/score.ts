import type {
  ExecutiveAlertCategory,
  ExecutiveAlertConfidence,
  ExecutiveAlertSeverity,
} from "@/lib/platform/executive-alerts/types";
import { SEVERITY_RANK } from "@/lib/platform/executive-alerts/types";

const CATEGORY_WEIGHT: Record<ExecutiveAlertCategory, number> = {
  Security: 12,
  Compliance: 10,
  Financial: 9,
  Staffing: 7,
  Enrollment: 6,
  Admissions: 6,
  Operations: 5,
  Executive: 4,
};

const CONFIDENCE_WEIGHT: Record<ExecutiveAlertConfidence, number> = {
  High: 8,
  Medium: 4,
  Low: 0,
  Unknown: -4,
};

/**
 * Priority model (1–100):
 *   base from severity (Critical 85 … Low 25)
 * + category weight
 * + confidence weight
 * + optional age boost (older open issues escalate slightly)
 * + optional source-count boost (corroboration)
 */
export function scoreAlert(input: {
  severity: ExecutiveAlertSeverity;
  category: ExecutiveAlertCategory;
  confidence: ExecutiveAlertConfidence;
  /** ISO timestamp; older open alerts get a small boost. */
  createdAt?: string | null;
  /** Number of corroborating sources after merge. */
  sourceCount?: number;
  now?: Date;
}): number {
  const severityBase: Record<ExecutiveAlertSeverity, number> = {
    Critical: 85,
    High: 65,
    Medium: 40,
    Low: 25,
  };

  let score =
    severityBase[input.severity] +
    CATEGORY_WEIGHT[input.category] +
    CONFIDENCE_WEIGHT[input.confidence];

  const sourceCount = input.sourceCount ?? 1;
  if (sourceCount > 1) {
    score += Math.min(8, (sourceCount - 1) * 2);
  }

  if (input.createdAt) {
    const now = input.now ?? new Date();
    const ageMs = now.getTime() - new Date(input.createdAt).getTime();
    if (Number.isFinite(ageMs) && ageMs > 0) {
      const ageDays = ageMs / 86_400_000;
      if (ageDays >= 7) score += 6;
      else if (ageDays >= 3) score += 3;
      else if (ageDays >= 1) score += 1;
    }
  }

  return clampPriority(score);
}

export function clampPriority(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function maxSeverity(
  a: ExecutiveAlertSeverity,
  b: ExecutiveAlertSeverity
): ExecutiveAlertSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

export function maxConfidence(
  a: ExecutiveAlertConfidence,
  b: ExecutiveAlertConfidence
): ExecutiveAlertConfidence {
  const rank: Record<ExecutiveAlertConfidence, number> = {
    High: 4,
    Medium: 3,
    Low: 2,
    Unknown: 1,
  };
  return rank[a] >= rank[b] ? a : b;
}

/** Map domain / MC severity strings into the executive contract. */
export function normalizeSeverity(raw: string | null | undefined): ExecutiveAlertSeverity {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "critical" || s === "urgent") return "Critical";
  if (s === "high" || s === "error") return "High";
  if (s === "warning") return "Medium";
  if (s === "medium" || s === "normal") return "Medium";
  if (s === "low" || s === "info") return "Low";
  return "Medium";
}

export function severityFromMetricStatus(
  status: string | null | undefined
): ExecutiveAlertSeverity | null {
  switch (status) {
    case "critical":
      return "Critical";
    case "at_risk":
      return "High";
    case "watch":
      return "Medium";
    default:
      return null;
  }
}
