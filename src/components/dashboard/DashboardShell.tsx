import type { ReactNode } from "react";
import { BrandingProvider } from "@/components/branding/BrandingContext";
import type { OrganizationBranding } from "@/lib/branding/types";
import { DashboardChrome } from "./DashboardChrome";

interface DashboardShellProps {
  fullName: string;
  roleLabel: string;
  branding: OrganizationBranding;
  /** When true, show Founder-only platform nav. Never true for non-FOUNDER roles. */
  isFounder?: boolean;
  /** When true, show Executive Director operating nav (never with Founder widgets). */
  isExecutiveDirector?: boolean;
  /** Effective permission keys — gates the Executive / Intelligence sidebar sections. */
  permissions?: readonly string[];
  impersonation?: { targetName: string } | null;
  notifications?: Array<{
    id: string;
    title: string;
    body: string;
    lead_id: string | null;
    created_at: string;
    notification_type: string;
    read_at?: string | null;
    href?: string | null;
    source?: "platform" | "admissions";
  }>;
  children: ReactNode;
}

/**
 * P006 — Server Component shell. Branding + page body stay outside the
 * interactive chrome island (sidebar toggle / TopNav / impersonation).
 */
export function DashboardShell({
  fullName,
  roleLabel,
  branding,
  isFounder = false,
  isExecutiveDirector = false,
  permissions = [],
  impersonation = null,
  notifications = [],
  children,
}: DashboardShellProps) {
  return (
    <BrandingProvider branding={branding}>
      <DashboardChrome
        fullName={fullName}
        roleLabel={roleLabel}
        supportModeLabel={branding.supportModeLabel}
        isFounder={isFounder}
        isExecutiveDirector={isExecutiveDirector}
        permissions={permissions}
        impersonation={impersonation}
        notifications={notifications}
      >
        {children}
      </DashboardChrome>
    </BrandingProvider>
  );
}
