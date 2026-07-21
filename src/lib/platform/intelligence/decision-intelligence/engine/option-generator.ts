import type {
  DecisionIssueKind,
  DecisionOption,
} from "@/lib/platform/intelligence/decision-intelligence/types";

interface OptionSeed {
  title: string;
  summary: string;
  category: string;
  benefits: string[];
  risks: string[];
  assumptions: string[];
  dependencies: string[];
  financial: number;
  operational: number;
  risk: number;
  timeToImplement: number;
  resourceRequirements: number;
  categoryBoost?: number;
}

const STAFFING_OPTIONS: OptionSeed[] = [
  {
    title: "Hire additional staff",
    summary: "Open targeted recruiting for hard-to-fill roles with retention packages.",
    category: "hire",
    benefits: ["Direct capacity recovery", "Signals commitment to quality"],
    risks: ["Time-to-fill lag", "Payroll pressure"],
    assumptions: ["Labor market can supply qualified candidates within 60 days"],
    dependencies: ["human-capital", "finance"],
    financial: 72,
    operational: 80,
    risk: 45,
    timeToImplement: 65,
    resourceRequirements: 75,
    categoryBoost: 10,
  },
  {
    title: "Reallocate existing staff",
    summary: "Shift coverage across campuses / schedules to stabilize instructional continuity.",
    category: "reallocate",
    benefits: ["Faster than hiring", "Uses known talent"],
    risks: ["Burnout risk", "Campus equity concerns"],
    assumptions: ["Surplus capacity exists in adjacent teams"],
    dependencies: ["human-capital", "operations"],
    financial: 35,
    operational: 70,
    risk: 55,
    timeToImplement: 35,
    resourceRequirements: 40,
  },
  {
    title: "Increase virtual capacity",
    summary: "Expand remote/hybrid instructional coverage for affected sections.",
    category: "virtual",
    benefits: ["Scalable stopgap", "Protects enrollment continuity"],
    risks: ["Parent acceptance", "Quality variance"],
    assumptions: ["Families accept virtual coverage short-term"],
    dependencies: ["operations", "customer"],
    financial: 40,
    operational: 65,
    risk: 50,
    timeToImplement: 45,
    resourceRequirements: 50,
  },
  {
    title: "Reduce class sizes / load",
    summary: "Temporarily reduce load where vacancies concentrate to protect quality.",
    category: "reduce_scope",
    benefits: ["Protects instructional quality", "Buys hiring time"],
    risks: ["Enrollment capacity dip", "Revenue pressure"],
    assumptions: ["Demand can flex for one term"],
    dependencies: ["customer", "operations"],
    financial: 55,
    operational: 60,
    risk: 48,
    timeToImplement: 40,
    resourceRequirements: 35,
  },
  {
    title: "Delay expansion",
    summary: "Pause growth initiatives until staffing stabilizes.",
    category: "delay",
    benefits: ["Protects core quality", "Reduces simultaneous strain"],
    risks: ["Missed growth window", "Competitive pressure"],
    assumptions: ["Expansion timeline is discretionary"],
    dependencies: ["strategic", "finance"],
    financial: 30,
    operational: 45,
    risk: 40,
    timeToImplement: 20,
    resourceRequirements: 20,
    categoryBoost: 5,
  },
];

const FINANCIAL_OPTIONS: OptionSeed[] = [
  {
    title: "Freeze non-critical spend",
    summary: "Immediate cash preservation while variance is diagnosed.",
    category: "delay",
    benefits: ["Fast cash relief"],
    risks: ["Operational friction"],
    assumptions: ["Non-critical spend is identifiable"],
    dependencies: ["finance", "operations"],
    financial: 70,
    operational: 40,
    risk: 35,
    timeToImplement: 15,
    resourceRequirements: 25,
  },
  {
    title: "Accelerate collections / funding draws",
    summary: "Pull forward receivables and eligible funding disbursements.",
    category: "invest",
    benefits: ["Improves liquidity"],
    risks: ["Relationship strain"],
    assumptions: ["Collections runway exists"],
    dependencies: ["finance", "funding"],
    financial: 75,
    operational: 50,
    risk: 40,
    timeToImplement: 40,
    resourceRequirements: 45,
  },
  {
    title: "Partner for shared services",
    summary: "Outsource or co-source non-core functions to cut cost-to-serve.",
    category: "partner",
    benefits: ["Structural cost reduction"],
    risks: ["Transition risk"],
    assumptions: ["Partner SLAs are enforceable"],
    dependencies: ["operations", "finance"],
    financial: 65,
    operational: 55,
    risk: 55,
    timeToImplement: 70,
    resourceRequirements: 60,
  },
];

const GENERIC_OPTIONS: OptionSeed[] = [
  {
    title: "Launch focused initiative",
    summary: "Stand up a time-boxed initiative with owner, milestones, and KPIs.",
    category: "invest",
    benefits: ["Clear ownership", "Measurable outcomes"],
    risks: ["Initiative overload"],
    assumptions: ["Executive sponsor available"],
    dependencies: ["operations"],
    financial: 55,
    operational: 65,
    risk: 45,
    timeToImplement: 50,
    resourceRequirements: 55,
  },
  {
    title: "Monitor and stage gates",
    summary: "Defer major action; increase monitoring with explicit stage gates.",
    category: "monitor",
    benefits: ["Avoids premature spend"],
    risks: ["Delayed response"],
    assumptions: ["Leading indicators are reliable"],
    dependencies: ["executive"],
    financial: 20,
    operational: 30,
    risk: 50,
    timeToImplement: 10,
    resourceRequirements: 15,
  },
  {
    title: "Automate the bottleneck",
    summary: "Apply automation/process redesign to the constrained workflow.",
    category: "automate",
    benefits: ["Durable capacity gain"],
    risks: ["Implementation lag"],
    assumptions: ["Process is automation-ready"],
    dependencies: ["operations", "innovation"],
    financial: 50,
    operational: 70,
    risk: 45,
    timeToImplement: 60,
    resourceRequirements: 55,
  },
];

export function generateOptionSeeds(kind: DecisionIssueKind): OptionSeed[] {
  if (kind === "staffing") return STAFFING_OPTIONS;
  if (kind === "financial" || kind === "enrollment") {
    return [...FINANCIAL_OPTIONS, ...GENERIC_OPTIONS.slice(0, 2)];
  }
  if (kind === "growth") {
    return [
      {
        title: "Invest in growth channel",
        summary: "Fund the highest-ROI growth channel identified by synthesis.",
        category: "invest",
        benefits: ["Accelerates expansion"],
        risks: ["Capital at risk"],
        assumptions: ["Demand signal is durable"],
        dependencies: ["revenue", "customer"],
        financial: 70,
        operational: 60,
        risk: 55,
        timeToImplement: 55,
        resourceRequirements: 65,
      },
      ...GENERIC_OPTIONS,
    ];
  }
  return GENERIC_OPTIONS;
}

export type { OptionSeed };

export function toPartialOption(
  seed: OptionSeed,
  id: string
): Pick<
  DecisionOption,
  | "id"
  | "title"
  | "summary"
  | "category"
  | "benefits"
  | "risks"
  | "assumptions"
  | "dependencies"
> & { seed: OptionSeed } {
  return {
    id,
    title: seed.title,
    summary: seed.summary,
    category: seed.category,
    benefits: seed.benefits,
    risks: seed.risks,
    assumptions: seed.assumptions,
    dependencies: seed.dependencies,
    seed,
  };
}
