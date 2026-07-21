import type { WorkflowTemplate } from "@/lib/platform/intelligence/executive-autonomous/types";

export const operationsWorkflow: WorkflowTemplate = {
  kind: "operations",
  label: "Operational improvement",
  objectiveTemplate: "Reduce operational friction with a controlled improvement rollout",
  defaultTasks: [
    {
      title: "Define improvement scope",
      description: "Clarify process target, owners, and success metrics",
      ownerRole: "operations_lead",
      estimatedDays: 2,
      dependsOn: [],
      checklist: ["Process map", "KPI baseline", "Owner named"],
      milestone: "Scoped",
    },
    {
      title: "Pilot change",
      description: "Run time-boxed pilot with monitoring",
      ownerRole: "operations_lead",
      estimatedDays: 14,
      dependsOn: [],
      checklist: ["Pilot group", "Monitoring dashboard", "Feedback loop"],
      milestone: "Pilot complete",
    },
    {
      title: "Scale or stop",
      description: "Decide scale-up based on pilot evidence and approvals",
      ownerRole: "executive_director",
      estimatedDays: 5,
      dependsOn: [],
      checklist: ["Evidence pack", "Scale decision recorded"],
      milestone: "Decision recorded",
    },
  ],
  successCriteria: [
    "Pilot KPI movement documented",
    "No unauthorized process change in production",
    "Rollback path remains available through pilot",
  ],
  rollbackDefaults: {
    conditions: ["KPI degradation", "Staff overload", "Policy conflict"],
    recoverySteps: [
      "Stop pilot",
      "Restore prior process",
      "Notify operations and affected campuses",
    ],
    notifications: ["operations_lead", "school_leader", "executive_director"],
    impactAssessment: "Process reverts to baseline; improvement gains are forfeited.",
  },
  assumptions: ["Baseline metrics are measurable", "Pilot capacity exists"],
};
