export const founderData = {
  user: {
    firstName: "Jimmy",
    fullName: "Jimmy Arispe",
    title: "Founder & CEO",
    avatarInitials: "JA",
  },
  organization: {
    name: "Jimmy's Academy Group",
    healthScore: 96,
    students: 487,
    employees: 83,
    schools: 5,
    cashFlowDays: 143,
  },
  overnightSummary: {
    attentionCount: 3,
    message:
      "I analyzed your organization overnight. Three items deserve your attention today.",
  },
  focusItems: [
    {
      id: "budget-approval",
      title: "Approve Q1 Budget Revisions",
      estimatedTime: "12 min",
      impact: "High — unlocks $284K in program funding",
      action: "Review Budget",
    },
    {
      id: "scholarship-review",
      title: "Scholarship Committee Decisions",
      estimatedTime: "18 min",
      impact: "Critical — 14 families awaiting response",
      action: "Review Applications",
    },
    {
      id: "enrollment-strategy",
      title: "Georgia Enrollment Gap",
      estimatedTime: "8 min",
      impact: "Strategic — 23 seats below target",
      action: "View Analysis",
    },
  ],
  aiBrief: `Good morning, Jimmy. Your organization is performing well overall — health score at 96%, up 2 points from last week.

**Financial position** remains strong with 143 days of cash runway. Revenue is tracking 4.2% above budget YTD. Georgia campus is the only location slightly behind enrollment targets.

**Today's priorities:** The scholarship committee has 14 pending decisions with two families requesting expedited review. Your Q1 budget revision needs signature before Friday's board prep. Teacher recognition nominations close at 5 PM — you have 3 outstanding approvals.

**Watch item:** Florida campus attendance dipped to 91.4% this week (normally 94%+). Operations flagged a transportation scheduling conflict that may be contributing. I've prepared a brief if you'd like details.`,
  healthMetrics: [
    { label: "Overall", value: 96, color: "#4f46e5" },
    { label: "Financial", value: 94, color: "#059669" },
    { label: "Operations", value: 92, color: "#0891b2" },
    { label: "Students", value: 97, color: "#7c3aed" },
    { label: "Staff", value: 93, color: "#d97706" },
    { label: "Mission", value: 98, color: "#4f46e5" },
    { label: "Compliance", value: 99, color: "#059669" },
  ],
  priorities: [
    {
      id: "budget",
      title: "Budget Approval",
      description: "Q1 revisions pending your signature",
      status: "urgent" as const,
      dueLabel: "Due Friday",
      progress: 85,
    },
    {
      id: "scholarship",
      title: "Scholarship Review",
      description: "14 applications awaiting decision",
      status: "critical" as const,
      dueLabel: "2 expedited",
      progress: 60,
    },
    {
      id: "recognition",
      title: "Teacher Recognition",
      description: "Excellence awards — 3 approvals needed",
      status: "normal" as const,
      dueLabel: "Closes 5 PM",
      progress: 72,
    },
    {
      id: "enrollment",
      title: "Enrollment Growth",
      description: "Georgia campus 23 seats below target",
      status: "watch" as const,
      dueLabel: "Strategic",
      progress: 78,
    },
  ],
  financial: {
    cashFlow: [
      { month: "Oct", value: 412000 },
      { month: "Nov", value: 438000 },
      { month: "Dec", value: 521000 },
      { month: "Jan", value: 445000 },
      { month: "Feb", value: 467000 },
      { month: "Mar", value: 489000 },
    ],
    revenue: { actual: 2847000, budget: 2732000, ytdGrowth: 4.2 },
    expenses: { actual: 2418000, budget: 2485000, variance: -2.7 },
    ebitda: { value: 429000, margin: 15.1 },
    forecast: { q2: 3120000, q3: 3280000, q4: 3450000 },
    budget: { allocated: 2485000, spent: 2418000, remaining: 67000 },
  },
  schools: [
    {
      id: "nj",
      name: "New Jersey Campus",
      location: "NJ",
      status: "healthy" as const,
      enrollment: 112,
      capacity: 120,
      attendance: 95.2,
      alerts: 0,
    },
    {
      id: "ga",
      name: "Georgia Campus",
      location: "GA",
      status: "watch" as const,
      enrollment: 97,
      capacity: 120,
      attendance: 92.8,
      alerts: 2,
    },
    {
      id: "fl",
      name: "Florida Campus",
      location: "FL",
      status: "watch" as const,
      enrollment: 108,
      capacity: 115,
      attendance: 91.4,
      alerts: 1,
    },
    {
      id: "virtual",
      name: "Virtual Academy",
      location: "Virtual",
      status: "healthy" as const,
      enrollment: 134,
      capacity: 150,
      attendance: 96.1,
      alerts: 0,
    },
    {
      id: "hs",
      name: "High School Program",
      location: "Multi-site",
      status: "healthy" as const,
      enrollment: 36,
      capacity: 40,
      attendance: 94.7,
      alerts: 0,
    },
  ],
  projects: [
    {
      id: "literacy",
      name: "Structured Literacy Expansion",
      owner: "Dr. Sarah Chen",
      completion: 78,
      risk: "low" as const,
    },
    {
      id: "enrollment-crm",
      name: "Enrollment CRM Migration",
      owner: "Marcus Williams",
      completion: 45,
      risk: "medium" as const,
    },
    {
      id: "board-portal",
      name: "Board Governance Portal",
      owner: "Elena Rodriguez",
      completion: 92,
      risk: "low" as const,
    },
    {
      id: "fl-facility",
      name: "Florida Facility Upgrade",
      owner: "David Park",
      completion: 34,
      risk: "high" as const,
    },
  ],
  governance: [
    {
      id: "policy-504",
      type: "Policy Review",
      title: "Section 504 Accommodation Policy v3.2",
      requester: "Compliance Team",
      age: "2 days",
    },
    {
      id: "delegation-hr",
      type: "Delegation",
      title: "HR Director — Hiring Authority Extension",
      requester: "Elena Rodriguez",
      age: "1 day",
    },
    {
      id: "exception-tuition",
      type: "Exception",
      title: "Tuition Payment Plan — Family #4821",
      requester: "Finance Office",
      age: "4 hours",
    },
    {
      id: "approval-contract",
      type: "Pending Approval",
      title: "Curriculum Vendor Contract — Lexia Core5",
      requester: "Academic Affairs",
      age: "3 days",
    },
  ],
  recommendations: [
    {
      id: "literacy-staffing",
      title: "Increase Structured Literacy staffing at Georgia campus",
      confidence: 94,
      evidence:
        "Reading assessment data shows 18% of K-3 students below benchmark. Georgia has 1 literacy specialist per 97 students vs. 1:72 network average. Projected ROI: 12% improvement in reading scores within one academic year.",
      impact: "High",
    },
    {
      id: "transport-fl",
      title: "Resolve Florida transportation scheduling conflict",
      confidence: 87,
      evidence:
        "Attendance correlation analysis links Mon/Wed 8:15 AM absences to Route 7 overlap. 73% of flagged absences occur on these days. Estimated recovery: 2.8 attendance points.",
      impact: "Medium",
    },
  ],
  askJagPrompts: [
    "What should I focus on today?",
    "Compare Georgia to Florida enrollment",
    "Draft board report summary",
    "Show financial risks this quarter",
  ],
} as const;

export type FocusItem = (typeof founderData.focusItems)[number];
export type HealthMetric = (typeof founderData.healthMetrics)[number];
export type Priority = (typeof founderData.priorities)[number];
export type School = (typeof founderData.schools)[number];
export type Project = (typeof founderData.projects)[number];
export type GovernanceItem = (typeof founderData.governance)[number];
export type Recommendation = (typeof founderData.recommendations)[number];
