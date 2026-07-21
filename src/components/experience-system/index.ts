/**
 * The JAG™ Experience System™ — shared interaction layer for every workspace.
 * Built on workspace-design-system primitives; workspaces consume this module only.
 */
export * from "./types";

// Navigation
export {
  GlobalNavigation,
  WorkspaceNavigation,
  Breadcrumbs,
  ContextNavigation,
  UniversalSearch,
  RecentItems,
  Favorites,
  WorkspaceNavLinks,
  useRecentItems,
  useFavorites,
} from "./navigation";
export type { XesNavItem, XesWorkspaceOption, XesBreadcrumb, XesRecentItem, XesFavoriteItem } from "./navigation";

// Page framework
export {
  PageLayout,
  PageHeader,
  ActionBar,
  ContextPanel,
  InsightPanelRegion,
  ActivityPanelRegion,
} from "./framework/PageLayout";

// Cards
export {
  StudentCard,
  FamilyCard,
  EmployeeCard,
  SessionCard,
  EvidenceCard,
  CompetencyCard,
  AlertCard,
  RecommendationCard,
  PriorityCard,
  ModuleCard,
} from "./cards";
export type {
  StudentCardProps,
  FamilyCardProps,
  EmployeeCardProps,
  SessionCardProps,
  EvidenceCardProps,
  CompetencyCardProps,
  RecommendationCardProps,
  AlertCardProps,
  ModuleCardProps,
} from "./cards";

// Lists
export { ExperienceDataList } from "./lists/ExperienceDataList";

// Panels
export {
  DetailPanel,
  TimelinePanel,
  AiInsightPanel,
  NotesPanel,
  ActivityPanel,
  QuickActions,
} from "./panels";

// Forms
export {
  ExperienceForm,
  FormField,
  AttachmentField,
  useFormDraft,
  useAutosave,
  InlineHelp,
  DraftBanner,
  useUnsavedChangesGuard,
  useDirtyForm,
} from "./forms";

// Feedback
export {
  SuccessBanner,
  WarningBanner,
  ErrorBanner,
  LoadingState,
  EmptyState,
  ProgressIndicator,
  BackgroundProcess,
  ActionButton,
  PendingActionButton,
  ActionChip,
  CTAButton,
  ActionChipGroup,
  inferActionChipVariant,
  OperationProgress,
  InlineRefresh,
  AiActivity,
  WorkspaceActivity,
  useActionFeedback,
  resolveActionLabels,
  ToastProvider,
  useToast,
  BackgroundJobsProvider,
  useBackgroundJobs,
  ShellActivityIndicator,
  GlobalProgressProvider,
  useGlobalProgress,
  InteractionProviders,
} from "./feedback";
export type {
  ActionButtonProps,
  ActionVariant,
  ActionChipProps,
  ActionChipVariant,
  ActionChipSize,
  ActionVerb,
  ActionStatus,
  ActionLabelSet,
  UseActionFeedbackOptions,
  UseActionFeedbackResult,
  OperationProgressProps,
  AiActivityProps,
  ToastTone,
  ToastInput,
} from "./feedback";

// Progressive navigation skeletons (UX-002)
export {
  SkeletonBone,
  SkeletonBlock,
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ListSkeleton,
  KpiTileSkeleton,
  KpiTilesSkeleton,
  DashboardSkeleton,
  ExecutiveWidgetSkeleton,
  FadeIn,
  WidgetBoundary,
  WidgetErrorBoundary,
  ProgressivePageShell,
  RouteProgressiveSkeleton,
  RouteLoadingSkeleton,
  staticWorkspaceSidebar,
  progressiveShellProps,
} from "./skeletons";
export type { WidgetBoundaryProps, ProgressivePageShellProps } from "./skeletons";

// Interaction
export { useKeyboardShortcuts, useFocusTrap, ConfirmDialog, xesMotion } from "./interaction";

// AI interaction
export {
  AiRecommendationCard,
  AiRecommendationList,
  ExplainRecommendation,
  HumanApprovalGate,
  RelatedEvidenceList,
  KnowledgeReferenceList,
} from "./ai";

// JAG Work
export { JagWorkItemCard, JagWorkPanel } from "./work/JagWorkPanel";

// JAG Profile
export { JagProfileOverviewPanel } from "./profile/JagProfileOverviewPanel";

// JAG Organization
export {
  JagOrganizationContextBar,
  JagOrganizationContextPanel,
} from "./organization/JagOrganizationContextPanel";

// Integration
export { ExperienceWorkspaceShell, TeacherExperienceShell, AdmissionsExperienceShell, StudentsExperienceShell, FinanceExperienceShell, HrExperienceShell, ExecutiveExperienceShell, SchedulingExperienceShell } from "./integration/ExperienceWorkspaceShell";

// Re-export foundational primitives workspaces still need
export {
  MetricCard,
  ExecutionPipeline,
  ProgressDomainChart,
  MasteryBadge,
  RiskIndicator,
  ConfidenceIndicator,
  InterventionCard,
  AiInsightCard,
  CardShell,
} from "@/components/workspace-design-system";

export type { XesAiRecommendation, XesKnowledgeReference, XesRelatedEvidence, XesQuickAction } from "./types";

export { ExperienceSystemShowcase } from "./showcase/ExperienceSystemShowcase";
