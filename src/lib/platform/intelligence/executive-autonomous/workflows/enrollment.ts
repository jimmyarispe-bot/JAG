import type { WorkflowTemplate } from "@/lib/platform/intelligence/executive-autonomous/types";

export const enrollmentWorkflow: WorkflowTemplate = {
  kind: "enrollment",
  label: "Enrollment campaign",
  objectiveTemplate: "Improve inquiry-to-enrollment conversion for the planning horizon",
  defaultTasks: [
    {
      title: "Segment funnel and message",
      description: "Identify weak conversion segments and craft outreach",
      ownerRole: "admissions_lead",
      estimatedDays: 3,
      dependsOn: [],
      checklist: ["Segment list", "Message variants", "Compliance review"],
      milestone: "Campaign designed",
    },
    {
      title: "Activate outreach",
      description: "Launch coordinated parent/guardian communications",
      ownerRole: "admissions_lead",
      estimatedDays: 10,
      dependsOn: [],
      checklist: ["Channels live", "Response SLAs set"],
      milestone: "Outreach live",
    },
    {
      title: "Convert and confirm seats",
      description: "Complete applications, funding checks, and seat confirmations",
      ownerRole: "school_leader",
      estimatedDays: 14,
      dependsOn: [],
      checklist: ["Applications complete", "Funding verified", "Seats confirmed"],
      milestone: "Seats confirmed",
    },
  ],
  successCriteria: [
    "Conversion rate improves vs baseline",
    "No unauthorized mass communication",
    "Capacity and staffing remain aligned",
  ],
  rollbackDefaults: {
    conditions: ["Message compliance issue", "Capacity overrun", "Funding block"],
    recoverySteps: [
      "Pause outreach",
      "Recall non-compliant messages",
      "Notify admissions and school leadership",
    ],
    notifications: ["admissions_lead", "school_leader", "executive_director"],
    impactAssessment: "Campaign paused; enrollment trajectory reverts to baseline forecast.",
  },
  assumptions: ["Contact consent records are valid", "Seat capacity is known"],
};
