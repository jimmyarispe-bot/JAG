/** Executive Intelligence SDK — insight provider contracts (no AI). */

export type InsightSeverity = "Info" | "Warning" | "Critical";

export type InsightDescriptor = {
  readonly id: string;
  readonly organizationId: string;
  readonly ruleId: string;
  readonly severity: InsightSeverity;
  readonly title: string;
  readonly description: string;
  readonly domain: string;
  readonly createdAt: string;
};

export type InsightEvaluationContext = {
  readonly organizationId: string;
  readonly asOf: string;
  readonly signals: Readonly<Record<string, number | string | boolean>>;
};

export type InsightRuleHit = {
  readonly severity: InsightSeverity;
  readonly title: string;
  readonly description: string;
  readonly suggestedNextStep: string;
};

export interface InsightRule {
  readonly id: string;
  readonly domain: string;
  readonly version: string;
  evaluate(ctx: InsightEvaluationContext): InsightRuleHit | null;
}

export interface InsightEvaluator {
  readonly id: string;
  evaluate(
    ctx: InsightEvaluationContext,
    rules: readonly InsightRule[]
  ): readonly InsightDescriptor[];
}

export interface InsightFormatter {
  readonly id: string;
  format(insight: InsightDescriptor): string;
}

export interface InsightProvider {
  readonly id: string;
  readonly version: string;
  rules(): readonly InsightRule[];
  evaluate(ctx: InsightEvaluationContext): readonly InsightDescriptor[];
  format(insight: InsightDescriptor): string;
}

export type InsightProviderRegistration = {
  readonly provider: InsightProvider;
  readonly registeredAt: string;
};
