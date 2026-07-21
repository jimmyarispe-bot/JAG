"use client";

import { useEffect, type ReactNode } from "react";
import { GlobalShell, WorkspaceLayout } from "@/components/workspace-design-system";
import {
  Breadcrumbs,
  ContextNavigation,
  Favorites,
  RecentItems,
  WorkspaceNavLinks,
  useFavorites,
  useRecentItems,
  useKeyboardShortcuts,
  type XesBreadcrumb,
  type XesNavItem,
  type XesNotification,
  type XesWorkspaceOption,
} from "../navigation";
import { ShellActivityIndicator } from "../feedback/BackgroundJobs";
import { ActivityPanelRegion } from "../framework/PageLayout";
import type { XesTimelineEntry } from "../types";

export interface ExperienceWorkspaceShellProps {
  workspaceKey: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: XesBreadcrumb[];
  navItems: XesNavItem[];
  contextNav?: XesNavItem[];
  workspaces?: XesWorkspaceOption[];
  notifications?: XesNotification[];
  fullName?: string;
  roleLabel?: string;
  searchPlaceholder?: string;
  leftNavTitle?: string;
  insightPanel?: ReactNode;
  insightTitle?: string;
  activityEntries?: { id: string; label: string; timestamp: string }[];
  headerActions?: ReactNode;
  children: ReactNode;
}

export function ExperienceWorkspaceShell({
  workspaceKey,
  title,
  subtitle,
  breadcrumbs,
  navItems,
  contextNav,
  workspaces,
  notifications = [],
  fullName,
  roleLabel,
  searchPlaceholder = "Search workspace…",
  leftNavTitle = "Workspace",
  insightPanel,
  insightTitle = "Insights",
  activityEntries = [],
  headerActions,
  children,
}: ExperienceWorkspaceShellProps) {
  const { items: recentItems, track } = useRecentItems(`xes-recent-${workspaceKey}`);
  const { items: favorites } = useFavorites(`xes-favorites-${workspaceKey}`);

  useKeyboardShortcuts({
    "Ctrl+K": () => document.getElementById("wds-shell-search")?.focus(),
  });

  useEffect(() => {
    const active = navItems.find((n) => n.active);
    if (active) track({ id: active.id, label: active.label, href: active.href });
  }, [navItems, track]);

  const leftNav = (
    <div className="space-y-4">
      <WorkspaceNavLinks items={navItems} />
      <RecentItems items={recentItems} />
      <Favorites items={favorites} />
    </div>
  );

  return (
    <GlobalShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      workspaces={workspaces}
      navItems={navItems}
      notifications={notifications}
      fullName={fullName}
      roleLabel={roleLabel}
      searchPlaceholder={searchPlaceholder}
      headerActions={
        <>
          <ShellActivityIndicator />
          {headerActions}
        </>
      }
    >
      {contextNav && contextNav.length > 0 && (
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs ?? []} className="mb-2" />
          <nav aria-label="Context navigation">{/* rendered below in main via prop injection */}</nav>
        </div>
      )}
      <WorkspaceLayout
        leftNavTitle={leftNavTitle}
        leftNav={leftNav}
        insightPanel={insightPanel}
        insightTitle={insightTitle}
        main={
          <div className="space-y-6">
            {contextNav && contextNav.length > 0 && <ContextNavigation items={contextNav} className="mb-2" />}
            {children}
            {activityEntries.length > 0 && (
              <ActivityPanelRegion title="Recent activity">
                <ul className="space-y-1 text-sm text-slate-600">
                  {activityEntries.map((e) => (
                    <li key={e.id} className="flex justify-between gap-2">
                      <span>{e.label}</span>
                      <time className="text-xs text-slate-400">{new Date(e.timestamp).toLocaleString()}</time>
                    </li>
                  ))}
                </ul>
              </ActivityPanelRegion>
            )}
          </div>
        }
      />
    </GlobalShell>
  );
}

/** Teacher Workspace™ — reference implementation using Experience System™. */
export function TeacherExperienceShell(props: Omit<ExperienceWorkspaceShellProps, "workspaceKey" | "title" | "leftNavTitle"> & {
  title?: string;
  leftNavTitle?: string;
}) {
  return (
    <ExperienceWorkspaceShell
      workspaceKey="teacher"
      title={props.title ?? "Teacher Workspace"}
      leftNavTitle={props.leftNavTitle ?? "Daily workflow"}
      searchPlaceholder="Search students, evidence, notes…"
      {...props}
    />
  );
}

export function AdmissionsExperienceShell(props: Omit<ExperienceWorkspaceShellProps, "workspaceKey" | "title" | "leftNavTitle"> & {
  title?: string;
  leftNavTitle?: string;
}) {
  return (
    <ExperienceWorkspaceShell
      workspaceKey="admissions"
      title={props.title ?? "Admissions & Enrollment"}
      leftNavTitle={props.leftNavTitle ?? "Enrollment work"}
      searchPlaceholder="Search leads, cases, tasks…"
      {...props}
    />
  );
}

export function StudentsExperienceShell(props: Omit<ExperienceWorkspaceShellProps, "workspaceKey" | "title" | "leftNavTitle"> & {
  title?: string;
  leftNavTitle?: string;
}) {
  return (
    <ExperienceWorkspaceShell
      workspaceKey="students"
      title={props.title ?? "Student Information"}
      leftNavTitle={props.leftNavTitle ?? "Student work"}
      searchPlaceholder="Search students, families, records…"
      {...props}
    />
  );
}

export function FinanceExperienceShell(props: Omit<ExperienceWorkspaceShellProps, "workspaceKey" | "title" | "leftNavTitle"> & {
  title?: string;
  leftNavTitle?: string;
}) {
  return (
    <ExperienceWorkspaceShell
      workspaceKey="finance"
      title={props.title ?? "Finance"}
      leftNavTitle={props.leftNavTitle ?? "Finance work"}
      searchPlaceholder="Search invoices, accounts, families…"
      {...props}
    />
  );
}

export function HrExperienceShell(props: Omit<ExperienceWorkspaceShellProps, "workspaceKey" | "title" | "leftNavTitle"> & {
  title?: string;
  leftNavTitle?: string;
}) {
  return (
    <ExperienceWorkspaceShell
      workspaceKey="hr"
      title={props.title ?? "Human Resources"}
      leftNavTitle={props.leftNavTitle ?? "Workforce work"}
      searchPlaceholder="Search employees, applications…"
      {...props}
    />
  );
}

export function ExecutiveExperienceShell(props: Omit<ExperienceWorkspaceShellProps, "workspaceKey" | "title" | "leftNavTitle"> & {
  title?: string;
  leftNavTitle?: string;
}) {
  return (
    <ExperienceWorkspaceShell
      workspaceKey="executive"
      title={props.title ?? "Executive Intelligence"}
      leftNavTitle={props.leftNavTitle ?? "Executive work"}
      searchPlaceholder="Search insights, KPIs, decisions…"
      {...props}
    />
  );
}

export function SchedulingExperienceShell(props: Omit<ExperienceWorkspaceShellProps, "workspaceKey" | "title" | "leftNavTitle"> & {
  title?: string;
  leftNavTitle?: string;
}) {
  return (
    <ExperienceWorkspaceShell
      workspaceKey="scheduling"
      title={props.title ?? "Scheduling Intelligence"}
      leftNavTitle={props.leftNavTitle ?? "Scheduling work"}
      searchPlaceholder="Search sections, conflicts, placements…"
      {...props}
    />
  );
}

export type { XesTimelineEntry };
