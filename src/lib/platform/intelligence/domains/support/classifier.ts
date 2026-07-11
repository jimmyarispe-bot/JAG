/**
 * Support Intelligence — request classifier.
 *
 * Categorizes tenant-agnostic support requests using signal and text cues.
 * No organization-specific rules.
 */

import type {
  SupportCategory,
  SupportClassification,
  SupportDiagnosticSignal,
  SupportRequest,
  SupportSeverity,
} from "@/lib/platform/intelligence/domains/support/types";
import { SUPPORT_CATEGORIES } from "@/lib/platform/intelligence/domains/support/types";
import type {
  IntelligenceCasePriority,
  IntelligenceConfidenceScore,
} from "@/lib/platform/intelligence/types";

/** Keyword cues mapped to support categories (reusable across all orgs). */
const CATEGORY_CUES: ReadonlyArray<{ category: SupportCategory; cues: readonly string[] }> = [
  {
    category: "authentication",
    cues: ["login", "sign in", "signin", "password", "auth", "session", "mfa", "2fa", "locked out"],
  },
  {
    category: "payments",
    cues: ["payment", "paid", "charge", "tuition", "invoice paid", "disappeared", "refund"],
  },
  {
    category: "billing",
    cues: ["billing", "invoice", "balance", "ledger", "statement", "scholarship"],
  },
  {
    category: "scheduling",
    cues: ["schedule", "scheduling", "calendar", "class time", "roster", "conflict"],
  },
  {
    category: "workflow",
    cues: ["workflow", "stuck", "transition", "approval", "pipeline", "automation failed"],
  },
  {
    category: "permissions",
    cues: ["permission", "access denied", "forbidden", "role", "can't see", "cannot access"],
  },
  {
    category: "missing_records",
    cues: ["missing", "not found", "disappeared", "blank record", "no data", "deleted"],
  },
  {
    category: "synchronization",
    cues: ["sync", "synchron", "out of date", "stale", "replication", "not updating"],
  },
  {
    category: "reporting",
    cues: ["report", "blank report", "export", "dashboard empty", "metrics wrong"],
  },
  {
    category: "integrations",
    cues: ["integration", "webhook", "quickbooks", "sso", "api connector", "third party"],
  },
  {
    category: "student_information",
    cues: ["student record", "sis", "enrollment", "profile", "demographics"],
  },
  {
    category: "attendance",
    cues: ["attendance", "absent", "present", "check-in", "roll call"],
  },
  {
    category: "communications",
    cues: ["message", "chat", "announcement", "communication"],
  },
  {
    category: "notifications",
    cues: ["notification", "alert not", "push", "bell"],
  },
  {
    category: "email",
    cues: ["email", "inbox", "smtp", "mail not"],
  },
  {
    category: "mobile",
    cues: ["mobile", "app crash", "ios", "android", "phone"],
  },
  {
    category: "performance",
    cues: ["slow", "timeout", "latency", "performance", "hanging"],
  },
];

/** Optional classifier configuration (still tenant-agnostic). */
export interface SupportClassifierOptions {
  /** Minimum cue hits before preferring a non-general category. */
  minCueHits?: number;
}

/**
 * Classifies support requests into reusable categories.
 */
export class SupportClassifier {
  private readonly minCueHits: number;

  /**
   * @param options - Optional classifier tuning (not org-specific).
   */
  constructor(options: SupportClassifierOptions = {}) {
    this.minCueHits = options.minCueHits ?? 1;
  }

  /**
   * Categorize a support request from subject, description, and signals.
   * @param request - Normalized support request.
   * @returns Classification with confidence and matched cues.
   */
  classify(request: SupportRequest): SupportClassification {
    const corpus = this.buildCorpus(request);
    const scores = this.scoreCategories(corpus, request.signals ?? []);
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);

    const top = ranked[0];
    const category: SupportCategory =
      top && top[1] >= this.minCueHits ? top[0] : "general";

    const secondaryCategories = ranked
      .filter(([cat, score]) => cat !== category && score >= this.minCueHits)
      .slice(0, 3)
      .map(([cat]) => cat);

    const matchedSignals = this.collectMatchedCues(corpus, category);
    const severity = this.inferSeverity(corpus, category);
    const priority = this.mapPriority(severity);
    const confidence = this.buildConfidence(top?.[1] ?? 0, matchedSignals.length);

    const rationale: string[] = [];
    if (category === "general") {
      rationale.push("No strong category cues matched; defaulted to general");
    } else {
      rationale.push(`Primary category "${category}" selected from cue scoring`);
    }
    if (request.affectedModule) {
      rationale.push(`Affected module noted: ${request.affectedModule}`);
    }

    return {
      requestId: request.requestId,
      category,
      secondaryCategories,
      severity,
      priority,
      confidence,
      matchedSignals,
      rationale,
      metadata: request.metadata,
    };
  }

  /**
   * Return the full set of supported categories.
   */
  listCategories(): readonly SupportCategory[] {
    return SUPPORT_CATEGORIES;
  }

  private buildCorpus(request: SupportRequest): string {
    return [request.subject, request.description ?? "", request.affectedModule ?? ""]
      .join(" ")
      .toLowerCase();
  }

  private scoreCategories(
    corpus: string,
    signals: SupportDiagnosticSignal[]
  ): Map<SupportCategory, number> {
    const scores = new Map<SupportCategory, number>();
    for (const category of SUPPORT_CATEGORIES) {
      scores.set(category, 0);
    }

    for (const entry of CATEGORY_CUES) {
      let hits = 0;
      for (const cue of entry.cues) {
        if (corpus.includes(cue)) {
          hits += 1;
        }
      }
      scores.set(entry.category, (scores.get(entry.category) ?? 0) + hits);
    }

    for (const signal of signals) {
      const signalText = `${signal.key} ${signal.label} ${String(signal.value)}`.toLowerCase();
      for (const entry of CATEGORY_CUES) {
        for (const cue of entry.cues) {
          if (signalText.includes(cue)) {
            scores.set(entry.category, (scores.get(entry.category) ?? 0) + 1);
          }
        }
      }
    }

    return scores;
  }

  private collectMatchedCues(corpus: string, category: SupportCategory): string[] {
    const entry = CATEGORY_CUES.find((item) => item.category === category);
    if (!entry) return [];
    return entry.cues.filter((cue) => corpus.includes(cue));
  }

  private inferSeverity(corpus: string, category: SupportCategory): SupportSeverity {
    if (
      corpus.includes("can't login") ||
      corpus.includes("cannot login") ||
      corpus.includes("outage") ||
      corpus.includes("down")
    ) {
      return "critical";
    }
    if (category === "authentication" || category === "payments" || category === "permissions") {
      return "high";
    }
    if (category === "general") {
      return "low";
    }
    return "medium";
  }

  private mapPriority(severity: SupportSeverity): IntelligenceCasePriority {
    return severity;
  }

  private buildConfidence(score: number, matchedCueCount: number): IntelligenceConfidenceScore {
    const value = Math.min(1, Math.max(0, score * 0.15 + matchedCueCount * 0.05));
    const level =
      value >= 0.75 ? "high" : value >= 0.45 ? "medium" : value > 0 ? "low" : "unknown";

    return {
      value,
      level,
      factors: [
        {
          key: "cue_score",
          label: "Category Cue Score",
          contribution: Math.min(1, score * 0.15),
          reason: `Weighted cue hits: ${score}`,
        },
        {
          key: "matched_cues",
          label: "Matched Cues",
          contribution: Math.min(1, matchedCueCount * 0.05),
          reason: `${matchedCueCount} cue(s) matched in request text`,
        },
      ],
    };
  }
}
