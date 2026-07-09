import type { ReactNode } from "react";

/** Shared Experience System™ types — inherited by every workspace. */
export type XesNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  active?: boolean;
};

export type XesWorkspaceOption = {
  id: string;
  label: string;
  href: string;
  description?: string;
  active?: boolean;
};

export type XesBreadcrumb = {
  label: string;
  href?: string;
};

export type XesRecentItem = {
  id: string;
  label: string;
  href: string;
  visitedAt: string;
};

export type XesFavoriteItem = {
  id: string;
  label: string;
  href: string;
};

export type XesNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  href?: string;
  read?: boolean;
};

export type XesTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

export type XesSavedView = {
  id: string;
  label: string;
  filters: Record<string, string>;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  groupKey?: string;
};

export type XesTimelineEntry = {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  status?: "complete" | "current" | "upcoming" | "warning";
  meta?: ReactNode;
};

export type XesKnowledgeReference = {
  id: string;
  title: string;
  layerKind?: string;
  href?: string;
};

export type XesRelatedEvidence = {
  id: string;
  title: string;
  artifactType?: string;
  href?: string;
};

export type XesAiRecommendation = {
  id: string;
  title: string;
  rationale: string;
  priority?: "low" | "medium" | "high";
  confidence?: number;
  actionLabel?: string;
  actionHref?: string;
  evidence?: XesRelatedEvidence[];
  knowledge?: XesKnowledgeReference[];
};

export type XesFormState = "idle" | "validating" | "saving" | "saved" | "error";

export type XesFeedbackTone = "success" | "warning" | "error" | "info";

export type XesQuickAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
};
