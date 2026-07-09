import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser, getSessionUser } from "@/lib/auth/session";
import { getIdentityContext } from "@/lib/platform/identity/context";
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

  const ctx = await getIdentityContext();

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
      notifications={notifications}
      impersonation={ctx.impersonation}
    >
      {children}
    </DashboardShell>
  );
}
