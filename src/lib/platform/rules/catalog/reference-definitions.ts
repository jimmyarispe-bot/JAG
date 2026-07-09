import type { RuleSetDefinition } from "@/lib/platform/rules/types";

function templateRuleSet(
  ruleSetKey: string,
  name: string,
  domain: string,
  sortOrder: number,
  sampleField: string,
  sampleThreshold: number,
  passOutcome: string,
  failOutcome: string
): RuleSetDefinition {
  return {
    ruleSetKey,
    name,
    description: `Reference rule set template for ${domain.replace(/_/g, " ")}`,
    domain,
    version: 1,
    status: "active",
    evaluationMode: "first_match",
    sortOrder,
    tags: [domain, "reference"],
    outcomes: [
      {
        outcomeKey: passOutcome,
        label: "Criteria Met",
        description: "Rule conditions satisfied",
        effects: { allowed: true },
      },
      {
        outcomeKey: failOutcome,
        label: "Criteria Not Met",
        description: "Rule conditions not satisfied",
        effects: { allowed: false },
      },
    ],
    rules: [
      {
        ruleKey: `${ruleSetKey}_threshold`,
        label: `${name} Threshold`,
        conditions: [
          {
            key: "threshold",
            field: sampleField,
            operator: "greater_than",
            value: sampleThreshold,
          },
        ],
        outcomeKey: passOutcome,
        weight: 100,
        sortOrder: 10,
      },
      {
        ruleKey: `${ruleSetKey}_default`,
        label: `${name} Default`,
        outcomeKey: failOutcome,
        weight: 10,
        sortOrder: 99,
      },
    ],
  };
}

/**
 * Reference rule sets demonstrating domain-organized, explainable evaluation.
 * Consuming modules register production rule sets — these are domain-agnostic templates.
 */
export const PLATFORM_REFERENCE_RULE_SETS: RuleSetDefinition[] = [
  {
    ruleSetKey: "ref_platform_access_gate",
    name: "Platform Access Gate",
    description: "Generic permission and role gate for platform operations",
    domain: "platform",
    version: 1,
    status: "active",
    evaluationMode: "first_match",
    sortOrder: 10,
    tags: ["platform", "access"],
    outcomes: [
      {
        outcomeKey: "grant_access",
        label: "Grant Access",
        effects: { access: "granted" },
      },
      {
        outcomeKey: "deny_access",
        label: "Deny Access",
        effects: { access: "denied" },
      },
    ],
    rules: [
      {
        ruleKey: "admin_role",
        label: "Administrator Role",
        conditions: [{ key: "role", field: "role", operator: "in", value: ["admin", "super_admin"] }],
        outcomeKey: "grant_access",
        sortOrder: 10,
      },
      {
        ruleKey: "staff_with_permission",
        label: "Staff With Permission",
        conditions: [
          { key: "perm", field: "has_permission", operator: "equals", value: true },
        ],
        outcomeKey: "grant_access",
        sortOrder: 20,
      },
      {
        ruleKey: "default_deny",
        label: "Default Deny",
        outcomeKey: "deny_access",
        sortOrder: 99,
      },
    ],
  },
  templateRuleSet(
    "ref_student_placement",
    "Student Placement",
    "student_placement",
    20,
    "placement_score",
    70,
    "place_advanced",
    "place_standard"
  ),
  templateRuleSet(
    "ref_structured_literacy_placement",
    "Structured Literacy Placement",
    "structured_literacy_placement",
    30,
    "decoding_accuracy",
    0.8,
    "wilson_tier_match",
    "wilson_tier_reassess"
  ),
  templateRuleSet(
    "ref_scheduling_block",
    "Scheduling Block",
    "scheduling",
    40,
    "available_minutes",
    45,
    "schedule_session",
    "defer_scheduling"
  ),
  templateRuleSet(
    "ref_tuition_assessment",
    "Tuition Assessment",
    "tuition",
    50,
    "family_income_index",
    0,
    "tuition_standard",
    "tuition_review_required"
  ),
  templateRuleSet(
    "ref_scholarship_eligibility",
    "Scholarship Eligibility",
    "scholarships",
    60,
    "eligibility_score",
    75,
    "scholarship_eligible",
    "scholarship_ineligible"
  ),
  templateRuleSet(
    "ref_teacher_assignment",
    "Teacher Assignment",
    "teacher_assignment",
    70,
    "qualification_match",
    0.85,
    "assign_teacher",
    "assignment_review"
  ),
  templateRuleSet(
    "ref_teacher_availability",
    "Teacher Availability",
    "teacher_availability",
    80,
    "open_slots",
    0,
    "teacher_available",
    "teacher_unavailable"
  ),
  {
    ruleSetKey: "ref_student_accommodations",
    name: "Student Accommodations",
    description: "Reference rule set template for student accommodations",
    domain: "student_accommodations",
    version: 1,
    status: "active",
    evaluationMode: "first_match",
    sortOrder: 90,
    tags: ["student_accommodations", "reference"],
    outcomes: [
      {
        outcomeKey: "apply_accommodations",
        label: "Apply Accommodations",
        effects: { allowed: true },
      },
      {
        outcomeKey: "no_accommodations",
        label: "No Accommodations Required",
        effects: { allowed: false },
      },
    ],
    rules: [
      {
        ruleKey: "accommodation_required",
        label: "Accommodation Required",
        conditions: [
          {
            key: "required",
            field: "accommodation_required",
            operator: "equals",
            value: true,
          },
        ],
        outcomeKey: "apply_accommodations",
        sortOrder: 10,
      },
      {
        ruleKey: "default_no_accommodation",
        label: "Default No Accommodation",
        outcomeKey: "no_accommodations",
        sortOrder: 99,
      },
    ],
  },
  {
    ruleSetKey: "ref_parent_permissions",
    name: "Parent Permissions",
    description: "Reference rule set template for parent permissions",
    domain: "parent_permissions",
    version: 1,
    status: "active",
    evaluationMode: "first_match",
    sortOrder: 100,
    tags: ["parent_permissions", "reference"],
    outcomes: [
      {
        outcomeKey: "parent_action_allowed",
        label: "Parent Action Allowed",
        effects: { allowed: true },
      },
      {
        outcomeKey: "parent_action_denied",
        label: "Parent Action Denied",
        effects: { allowed: false },
      },
    ],
    rules: [
      {
        ruleKey: "consent_granted",
        label: "Consent Granted",
        conditions: [{ key: "consent", field: "consent_granted", operator: "equals", value: true }],
        outcomeKey: "parent_action_allowed",
        sortOrder: 10,
      },
      {
        ruleKey: "default_deny",
        label: "Default Deny",
        outcomeKey: "parent_action_denied",
        sortOrder: 99,
      },
    ],
  },
  templateRuleSet(
    "ref_graduation_readiness",
    "Graduation Readiness",
    "graduation_readiness",
    110,
    "readiness_score",
    85,
    "graduation_ready",
    "graduation_not_ready"
  ),
  templateRuleSet(
    "ref_payroll_eligibility",
    "Payroll Eligibility",
    "payroll",
    120,
    "hours_logged",
    0,
    "payroll_process",
    "payroll_hold"
  ),
  templateRuleSet(
    "ref_executive_reporting",
    "Executive Reporting",
    "executive_reporting",
    130,
    "metric_threshold",
    90,
    "report_publish",
    "report_review"
  ),
];

export const PLATFORM_RULE_SET_CATALOG = PLATFORM_REFERENCE_RULE_SETS;
