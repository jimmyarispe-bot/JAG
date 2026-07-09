/** Canonical Rules Engine domain keys — extension points for consuming modules. */
export const RULE_ENGINE_DOMAINS = [
  "platform",
  "student_placement",
  "structured_literacy_placement",
  "scheduling",
  "tuition",
  "scholarships",
  "teacher_assignment",
  "teacher_availability",
  "student_accommodations",
  "parent_permissions",
  "graduation_readiness",
  "payroll",
  "executive_reporting",
] as const;

export type RuleEngineDomain = (typeof RULE_ENGINE_DOMAINS)[number];
