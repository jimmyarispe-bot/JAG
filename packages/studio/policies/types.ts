export type PolicyCategory =
  | "Architecture"
  | "Testing"
  | "Documentation"
  | "Security"
  | "Operations"
  | "Accessibility"
  | "Performance"
  | "Other";

export type PolicyRule =
  | "min_coverage"
  | "required_documentation"
  | "required_accessibility_review"
  | "required_performance_baseline"
  | "required_security_validation"
  | "no_circular_dependencies"
  | "no_critical_findings"
  | "custom";

export type GovernancePolicy = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: PolicyCategory;
  readonly rule: PolicyRule;
  readonly threshold: number | null;
  readonly required: boolean;
  readonly productIds: readonly string[] | null;
  readonly enabled: boolean;
};

export type PolicyEvaluation = {
  readonly policyId: string;
  readonly passed: boolean;
  readonly score: number;
  readonly evidence: readonly string[];
  readonly detail: string;
};

export type PolicyComplianceReport = {
  readonly productId: string;
  readonly evaluatedAt: string;
  readonly evaluations: readonly PolicyEvaluation[];
  readonly passedRequired: boolean;
  readonly compliancePercent: number;
};
