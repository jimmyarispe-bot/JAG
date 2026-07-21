import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser } from "@/lib/auth/auth-user";
import { canViewExecutiveDirectorDashboard } from "@/lib/dashboard/executive-director-dashboard";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import { requireAuthorizedRoute } from "@/lib/platform/identity/page-guard";
import { getRequestWorkspaceContext } from "@/lib/platform/identity/request-context";
import { getStaffNotifications } from "@/lib/admissions/communications/queries";
import {
  listInAppNotifications,
  toNavNotificationShape,
} from "@/lib/communications/notifications";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { commitTrace, measureAsync } from "@/lib/performance/measure";

/**
 * Sprint P002 — single identity/branding load for the dashboard tree.
 * Middleware already authenticated; this layout authorizes once and shares context.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const spans = [];

  const { value: auth, span: authSpan } = await measureAsync(
    "layout.auth_user",
    () => getAuthUser(),
    { phase: "authentication" }
  );
  spans.push(authSpan);

  if (!auth.user) {
    redirect("/login");
  }

  redirectIfPasswordResetRequired(auth.user, "/dashboard");

  const { value: headerStore, span: headersSpan } = await measureAsync(
    "layout.headers",
    () => headers(),
    { phase: "request_meta" }
  );
  spans.push(headersSpan);

  const pathname = headerStore.get("x-pathname") ?? "/dashboard";
  const search = (() => {
    const full = headerStore.get("x-url");
    if (!full) return "";
    const q = full.indexOf("?");
    return q >= 0 ? full.slice(q) : "";
  })();

  // Catalog authorization once (identity + permissions are request-cached).
  const { value: ctx, span: authzSpan } = await measureAsync(
    "layout.requireAuthorizedRoute",
    () => requireAuthorizedRoute(pathname, search),
    { phase: "permissions+identity", pathname }
  );
  spans.push(authzSpan);

  if (!ctx) {
    commitTrace({ route: pathname, label: "dashboard-layout-unauth", spans });
    redirect("/login");
  }

  // P006: branding/workspace and notifications are independent once identity is known.
  const { value: shellData, span: shellSpan } = await measureAsync(
    "layout.workspace_shell",
    async () => {
      const [workspace, admissionsNotifications, supabase] = await Promise.all([
        getRequestWorkspaceContext(),
        getStaffNotifications(ctx.id),
        createAuthClient(),
      ]);
      const platformNotifications = await listInAppNotifications(supabase, ctx.id, 25);
      const notifications = [
        ...platformNotifications.map((n) => ({
          ...toNavNotificationShape(n),
          source: "platform" as const,
        })),
        ...admissionsNotifications.map((n) => ({
          ...n,
          source: "admissions" as const,
        })),
      ].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        branding: workspace?.branding,
        notifications,
      };
    },
    { phase: "org_branding+notifications" }
  );
  spans.push(shellSpan);

  commitTrace({
    route: pathname,
    label: "dashboard-layout",
    spans,
  });

  if (!shellData.branding) {
    redirect("/login");
  }

  return (
    <DashboardShell
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      branding={shellData.branding}
      isFounder={canViewFounderDashboard(ctx)}
      isExecutiveDirector={canViewExecutiveDirectorDashboard(ctx)}
      notifications={shellData.notifications}
      impersonation={ctx.impersonation}
    >
      {children}
    </DashboardShell>
  );
}
