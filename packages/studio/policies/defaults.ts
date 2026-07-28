/**
 * Default governance policies — Studio-local; configurable per product.
 */

import type { GovernancePolicy } from "./types";

export const DEFAULT_POLICIES: readonly GovernancePolicy[] = Object.freeze([
  {
    id: "policy.coverage.min",
    name: "Minimum test coverage",
    description: "Overall test pass/coverage ratio must meet threshold.",
    category: "Testing",
    rule: "min_coverage",
    threshold: 70,
    required: true,
    productIds: null,
    enabled: true,
  },
  {
    id: "policy.docs.required",
    name: "Required documentation",
    description: "API docs, release notes capability, and upgrade guidance present.",
    category: "Documentation",
    rule: "required_documentation",
    threshold: 70,
    required: true,
    productIds: null,
    enabled: true,
  },
  {
    id: "policy.a11y.review",
    name: "Accessibility review",
    description: "Accessibility suite or hardening evidence required before Certified.",
    category: "Accessibility",
    rule: "required_accessibility_review",
    threshold: null,
    required: true,
    productIds: Object.freeze(["academyos"]),
    enabled: true,
  },
  {
    id: "policy.perf.baseline",
    name: "Performance baseline",
    description: "Performance baseline / budget evidence required before RC-3+.",
    category: "Performance",
    rule: "required_performance_baseline",
    threshold: null,
    required: true,
    productIds: null,
    enabled: true,
  },
  {
    id: "policy.security.validation",
    name: "Security validation",
    description: "No Critical security findings; permission validation complete.",
    category: "Security",
    rule: "required_security_validation",
    threshold: 0,
    required: true,
    productIds: null,
    enabled: true,
  },
  {
    id: "policy.arch.no_cycles",
    name: "No circular dependencies",
    description: "Architecture dependency cycles block Certified/Released.",
    category: "Architecture",
    rule: "no_circular_dependencies",
    threshold: 0,
    required: true,
    productIds: null,
    enabled: true,
  },
]);
