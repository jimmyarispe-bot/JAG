import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser, getSessionUser } from "@/lib/auth/session";
import { canViewExecutiveDirectorDashboard } from "@/lib/dashboard/executive-director-dashboard";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import { requireAuthorizedRoute } from "@/lib/platform/identity/page-guard";
import { getStaffNotifications } from "@/lib/admissions/communications/queries";
import { loadOrganizationBranding } from "@/lib/branding";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ user }, sessionUser] = await Promise.all([getAuthUser(), getSessionUser()]);

  if (!user || !sessionUser) {
    redirect("/login");
  }

  redirectIfPasswordResetRequired(user, "/dashboard");

  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/dashboard";
  const search = (() => {
    const full = headerStore.get("x-url");
    if (!full) return "";
    const q = full.indexOf("?");
    return q >= 0 ? full.slice(q) : "";
  })();

  // Centralized route auth (JAG / AcademyOS / Finance / Payroll)
  const ctx = await requireAuthorizedRoute(pathname, search);

  if (!ctx) {
    redirect("/login");
  }

  const { supabase } = await getAuthUser();
  const [notifications, branding] = await Promise.all([
    getStaffNotifications(ctx.id),
    loadOrganizationBranding(supabase),
  ]);

  return (
    <DashboardShell
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      branding={branding}
      isFounder={canViewFounderDashboard(ctx)}
      isExecutiveDirector={canViewExecutiveDirectorDashboard(ctx)}
      notifications={notifications}
      impersonation={ctx.impersonation}
    >
      {children}
    </DashboardShell>
  );
}
