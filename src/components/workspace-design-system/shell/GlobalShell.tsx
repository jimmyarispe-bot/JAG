"use client";

import { Suspense, type ReactNode } from "react";
import { ShellHeader } from "./ShellHeader";
import { ShellNavigation } from "./ShellNavigation";
import { ShellNotifications } from "./ShellNotifications";
import { ShellSearch } from "./ShellSearch";
import { ShellUserProfile } from "./ShellUserProfile";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import type { WdsNavItem, WdsNotification, WdsWorkspaceOption } from "../types";
import { cn } from "../utils";

export interface GlobalShellProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  navItems?: WdsNavItem[];
  workspaces?: WdsWorkspaceOption[];
  notifications?: WdsNotification[];
  fullName?: string;
  roleLabel?: string;
  searchPlaceholder?: string;
  headerActions?: ReactNode;
  onNotificationRead?: (id: string) => void;
  children: ReactNode;
  className?: string;
}

export function GlobalShell({
  title,
  subtitle,
  breadcrumbs,
  navItems,
  workspaces,
  notifications = [],
  fullName,
  roleLabel,
  searchPlaceholder,
  headerActions,
  onNotificationRead,
  children,
  className,
}: GlobalShellProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <header className="sticky top-0 z-20 -mx-4 border-b border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {workspaces && workspaces.length > 0 && <WorkspaceSwitcher workspaces={workspaces} />}
            <ShellHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} className="min-w-0 flex-1" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Suspense fallback={null}>
              <ShellSearch placeholder={searchPlaceholder} />
            </Suspense>
            {headerActions}
            <ShellNotifications notifications={notifications} onMarkRead={onNotificationRead} />
            {fullName && roleLabel && <ShellUserProfile fullName={fullName} roleLabel={roleLabel} />}
          </div>
        </div>
        {navItems && navItems.length > 0 && (
          <div className="mt-4">
            <ShellNavigation items={navItems} />
          </div>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
