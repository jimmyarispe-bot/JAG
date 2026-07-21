"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ImpersonationBanner } from "@/components/platform/ImpersonationBanner";

type Notification = {
  id: string;
  title: string;
  body: string;
  lead_id: string | null;
  created_at: string;
  notification_type: string;
};

interface DashboardChromeProps {
  fullName: string;
  roleLabel: string;
  supportModeLabel: string;
  isFounder?: boolean;
  isExecutiveDirector?: boolean;
  impersonation?: { targetName: string } | null;
  notifications?: Notification[];
  children: ReactNode;
}

/**
 * P006 — client island for sidebar open state + nav chrome only.
 * Page `{children}` remain Server Components (RSC slots).
 */
export function DashboardChrome({
  fullName,
  roleLabel,
  supportModeLabel,
  isFounder = false,
  isExecutiveDirector = false,
  impersonation = null,
  notifications = [],
  children,
}: DashboardChromeProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        isFounder={isFounder}
        isExecutiveDirector={isExecutiveDirector}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {impersonation && (
          <ImpersonationBanner
            targetName={impersonation.targetName}
            supportModeLabel={supportModeLabel}
          />
        )}
        <TopNav
          fullName={fullName}
          roleLabel={roleLabel}
          notifications={notifications}
          onMenuClick={openSidebar}
        />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
