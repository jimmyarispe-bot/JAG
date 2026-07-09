"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ImpersonationBanner } from "@/components/platform/ImpersonationBanner";
import { BrandingProvider } from "@/components/branding/BrandingContext";
import type { OrganizationBranding } from "@/lib/branding/types";

interface DashboardShellProps {
  fullName: string;
  roleLabel: string;
  branding: OrganizationBranding;
  impersonation?: { targetName: string } | null;
  notifications?: Array<{
    id: string;
    title: string;
    body: string;
    lead_id: string | null;
    created_at: string;
    notification_type: string;
  }>;
  children: React.ReactNode;
}

export function DashboardShell({
  fullName,
  roleLabel,
  branding,
  impersonation = null,
  notifications = [],
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <BrandingProvider branding={branding}>
      <div className="flex min-h-screen bg-slate-50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />

        <div className="flex min-w-0 flex-1 flex-col">
          {impersonation && (
            <ImpersonationBanner
              targetName={impersonation.targetName}
              supportModeLabel={branding.supportModeLabel}
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
    </BrandingProvider>
  );
}
