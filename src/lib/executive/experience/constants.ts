/**
 * Wave 1.6 Executive Workspace — product constants.
 * Presentation/orchestration only; no parallel finance, LI, strategy, or reporting engines.
 */

export const EXECUTIVE_EXPERIENCE_ENGINES = Object.freeze([
  "OrganizationEngine",
  "IdentityEngine",
  "FinanceEngine",
  "ChiefFinancialOfficerEngine",
  "LearningIntelligenceEngine",
  "KnowledgeEngine",
  "InnovationEngine",
  "StrategyEngine",
  "Reporting",
  "Workflow",
  "Communications",
  "Notifications",
  "DigitalTwin",
  "EvidenceLedger",
  "OrganizationalMemory",
] as const);

export const EXECUTIVE_EXPERIENCE_GUARDS = Object.freeze({
  productExperienceOnly: true,
  createsPlatformEngines: false,
  duplicatesBusinessLogic: false,
  duplicatesFinance: false,
  duplicatesLearningIntelligence: false,
  duplicatesKnowledge: false,
  duplicatesReporting: false,
  duplicatesStrategyLogic: false,
  financeReadOnlySummaries: true,
  cfoReadOnlyExecutiveSummaries: true,
  noSpeculativeAi: true,
});

export const EXECUTIVE_EXPERIENCE_NAV = Object.freeze([
  { href: "/dashboard/executive", label: "Home", exact: true },
  { href: "/dashboard/executive/multi-school", label: "Multi-School" },
  { href: "/dashboard/executive/academics", label: "Academics" },
  { href: "/dashboard/executive/operations", label: "Operations" },
  { href: "/dashboard/executive/finance", label: "Finance" },
  { href: "/dashboard/executive/people", label: "People" },
  { href: "/dashboard/executive/strategy", label: "Strategy" },
  { href: "/dashboard/executive/innovation", label: "Innovation" },
  { href: "/dashboard/executive/intelligence", label: "Org Intelligence" },
  { href: "/dashboard/executive/reports", label: "Reports" },
  { href: "/dashboard/executive/communications", label: "Communications" },
  { href: "/dashboard/executive/profile", label: "Profile" },
] as const);

export const EXECUTIVE_QUICK_ACTIONS = Object.freeze([
  { href: "/dashboard/executive/multi-school", label: "Multi-school overview" },
  { href: "/dashboard/executive/finance", label: "Finance summaries" },
  { href: "/dashboard/executive/strategy", label: "Strategy" },
  { href: "/dashboard/executive/innovation", label: "Innovation portfolio" },
  { href: "/dashboard/executive/operations", label: "Operations" },
  { href: "/dashboard/executive/reports", label: "Reports" },
  { href: "/dashboard/executive/board", label: "Board packs" },
  { href: "/dashboard/executive/briefings", label: "Briefings" },
  { href: "/dashboard/executive/kpis", label: "KPI center" },
] as const);
