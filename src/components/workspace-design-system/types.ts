import type { ReactNode } from "react";

export interface WdsNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  active?: boolean;
}

export interface WdsWorkspaceOption {
  id: string;
  label: string;
  href: string;
  description?: string;
  active?: boolean;
}

export interface WdsNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  href?: string;
  read?: boolean;
}

export interface WdsTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface WdsTimelineEntry {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  status?: "complete" | "current" | "upcoming" | "warning";
  meta?: ReactNode;
}

export interface WdsChartPoint {
  label: string;
  value: number;
}

export interface WdsFilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface WdsQuickAction {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
}
