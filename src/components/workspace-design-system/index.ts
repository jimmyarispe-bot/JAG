export * from "./tokens";
export * from "./utils";
export * from "./types";

// Shell
export { GlobalShell, type GlobalShellProps } from "./shell/GlobalShell";
export { ShellHeader } from "./shell/ShellHeader";
export { ShellNavigation } from "./shell/ShellNavigation";
export { WorkspaceSwitcher } from "./shell/WorkspaceSwitcher";
export { ShellSearch } from "./shell/ShellSearch";
export { ShellNotifications } from "./shell/ShellNotifications";
export { ShellUserProfile } from "./shell/ShellUserProfile";

// Layout
export { WorkspaceLayout, type WorkspaceLayoutProps } from "./layout/WorkspaceLayout";
export { LeftNav } from "./layout/LeftNav";
export { MainContent } from "./layout/MainContent";
export { InsightPanel } from "./layout/InsightPanel";

// Cards
export { CardShell } from "./cards/CardShell";
export { StudentCard, type StudentCardProps } from "./cards/StudentCard";
export { CompetencyCard, type CompetencyCardProps } from "./cards/CompetencyCard";
export { AtomicSkillCard, type AtomicSkillCardProps } from "./cards/AtomicSkillCard";
export { EvidenceCard, type EvidenceCardProps } from "./cards/EvidenceCard";
export { RecommendationCard, type RecommendationCardProps } from "./cards/RecommendationCard";
export { InterventionCard, type InterventionCardProps } from "./cards/InterventionCard";
export { AiInsightCard, type AiInsightCardProps } from "./cards/AiInsightCard";

// Timelines
export { ProgressTimeline, EvidenceTimeline, JourneyTimeline } from "./timeline/Timelines";

// Execution pipeline
export {
  ExecutionPipeline,
  ExecutionPipelineCard,
  WDS_EXECUTION_PIPELINE_STEPS,
  type WdsExecutionStepId,
  type WdsExecutionStepState,
} from "./pipeline/ExecutionPipeline";

// Tables
export {
  StudentTable,
  CompetencyTable,
  EvidenceTable,
  type StudentTableRow,
  type CompetencyTableRow,
  type EvidenceTableRow,
} from "./tables/DataTables";

// Panels
export { FilterPanel, DetailDrawer, QuickActionsPanel, SidePanel } from "./panels/Panels";

// Charts
export {
  MasteryProgressChart,
  EvidenceQualityChart,
  CompetencyCompletionChart,
  AiConfidenceChart,
  ProgressDomainChart,
} from "./charts/Charts";

// Status
export { MasteryBadge } from "./status/MasteryBadge";
export { RiskIndicator } from "./status/RiskIndicator";
export { ConfidenceIndicator } from "./status/ConfidenceIndicator";
export { InterventionIndicator } from "./status/InterventionIndicator";
export { RecommendationIndicator } from "./status/RecommendationIndicator";

// Metric card (StatCard equivalent for workspaces)
export { MetricCard } from "./cards/MetricCard";

// Showcase
export { DesignSystemShowcase } from "./showcase/DesignSystemShowcase";

// Teacher workspace integration — use Experience System™
export { TeacherExperienceShell as TeacherWorkspaceShell } from "@/components/experience-system";
