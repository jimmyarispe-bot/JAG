/**
 * Fluent recommendation builder — proposals only, no Action execution.
 */

import { clampConfidence, normalizeConfidence } from "./EducationConfidence";
import type { EducationAnalysisContext } from "./EducationContributorContext";
import type {
  EducationActionProposal,
  EducationRecommendation,
} from "./EducationContributorResult";
import type { EducationEvidenceItem } from "./EducationEvidenceBuilder";
import { formatEducationExplanation } from "./EducationExplanation";
import { normalizePriority } from "./EducationPriority";
import { createEducationTrace } from "./EducationTrace";

export class EducationRecommendationDraftBuilder {
  private kindValue = "";
  private titleValue = "";
  private confidenceValue = 0.7;
  private priorityValue = 3;
  private reasonValue = "";
  private supportCodes: string[] = [];
  private supportIds: string[] = [];
  private actions: EducationActionProposal[] = [];
  private typeValue: "actionable" | "warning" | "informational" | "opportunity" =
    "actionable";

  constructor(private readonly contributorId: string) {}

  recommend(kind: string, title: string): this {
    this.kindValue = kind;
    this.titleValue = title;
    return this;
  }

  confidence(value: number | "high" | "medium" | "low"): this {
    this.confidenceValue = normalizeConfidence(value);
    return this;
  }

  priority(value: number | "critical" | "high" | "medium" | "low" | "informational"): this {
    this.priorityValue = normalizePriority(value).rank;
    return this;
  }

  because(reason: string): this {
    this.reasonValue = reason;
    return this;
  }

  supportedBy(...codesOrIds: string[]): this {
    for (const token of codesOrIds) {
      if (token.includes(":")) this.supportIds.push(token);
      else this.supportCodes.push(token);
    }
    return this;
  }

  proposeAction(input: {
    kind: string;
    actionId: string;
    label?: string;
    priority?: number;
    rationale: string;
  }): this {
    this.actions.push({
      kind: input.kind,
      actionId: input.actionId,
      label: input.label ?? input.kind,
      priority: input.priority ?? 1,
      rationale: input.rationale,
    });
    return this;
  }

  asWarning(): this {
    this.typeValue = "warning";
    return this;
  }

  asInformational(): this {
    this.typeValue = "informational";
    return this;
  }

  build(evidence: readonly EducationEvidenceItem[]): EducationRecommendation {
    if (!this.kindValue || !this.titleValue) {
      throw new Error("recommend(kind, title) is required");
    }
    if (!this.reasonValue) {
      throw new Error("because(reason) is required");
    }

    const byCode = evidence.filter((e) => this.supportCodes.includes(e.code));
    const byId = evidence.filter((e) => this.supportIds.includes(e.id));
    const matched = [...byCode, ...byId];
    const unique = new Map(matched.map((e) => [e.id, e]));
    const evidenceIds =
      unique.size > 0
        ? [...unique.keys()]
        : evidence.map((e) => e.id).slice(0, 3);

    const confidence = clampConfidence(this.confidenceValue);
    const primaryAction = this.actions[0]?.actionId;
    const formatted = formatEducationExplanation({
      reason: this.reasonValue,
      evidenceIds,
      confidence,
      priority: this.priorityValue,
      suggestedAction: primaryAction,
    });

    return {
      id: `rec.${this.kindValue}`,
      kind: this.kindValue,
      title: this.titleValue,
      explanation: this.reasonValue,
      confidence,
      priority: this.priorityValue,
      evidenceIds,
      suggestedActions: [...this.actions],
      constitutionalTrace: createEducationTrace({
        contributorId: this.contributorId,
        rationale: this.reasonValue,
      }),
      attributes: {
        why: this.reasonValue,
        supportingEvidenceIds: evidenceIds,
        confidence,
        priority: this.priorityValue,
        type: this.typeValue,
        formattedExplanation: formatted.summary,
      },
    };
  }
}

export class EducationRecommendationBuilder {
  private readonly drafts: EducationRecommendationDraftBuilder[] = [];

  constructor(private readonly contributorId: string) {}

  recommend(kind: string, title: string): EducationRecommendationDraftBuilder {
    const draft = new EducationRecommendationDraftBuilder(this.contributorId);
    draft.recommend(kind, title);
    this.drafts.push(draft);
    return draft;
  }

  build(evidence: readonly EducationEvidenceItem[]): EducationRecommendation[] {
    return this.drafts
      .map((d) => d.build(evidence))
      .sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
  }
}

export function createEducationRecommendationBuilder(
  contributorId: string
): EducationRecommendationBuilder {
  return new EducationRecommendationBuilder(contributorId);
}

/** Helper when recommend fn receives full analysis context. */
export type EducationRecommendFn<TObservation> = (
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<TObservation>
) => void;
