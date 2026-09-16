import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { GuideProvider } from "@/components/guides/GuideProvider";
import { GuideChooser } from "@/components/guides/GuideChooser";
import { GuidePanel } from "@/components/guides/GuidePanel";
import { EnvironmentBanner } from "@/components/platform/EnvironmentBanner";
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
      /*
       * THE SIDEBAR CANNOT SEE WHO YOU ARE WITHOUT THIS.
       *
       * module-visibility hides every module that names a required permission
       * unless the viewer holds one of them, and it fails CLOSED on purpose:
       * "a page that could not work out who you are should not conclude you may
       * see the money." Correct — but this prop was never passed, so it
       * defaulted to [] through DashboardShell, DashboardChrome and Sidebar, and
       * the answer for EVERY viewer was nobody.
       *
       * The result was a sidebar of exactly the modules that name no permission
       * — Families, Communications, Workflows, Calendar, Documents — and the
       * silent disappearance of every one that does: Admissions, Student
       * Success, Scholarships, Finance, Workforce, Scheduling, Teacher Studio.
       * Not for one role. For the Founder, and for every School Leader.
       *
       * It read as data loss rather than a hidden menu, which is why it went
       * unreported: the modules were simply not on screen, and the pages behind
       * them still worked if you knew the URL.
       *
       * The permission map had its own test and passed it. Nothing tested that
       * the list ever arrived, so the seam was where it broke.
       */
      permissions={ctx.permissions}
    >
      {/* Renders nothing on a correctly-configured production deployment. */}
      <EnvironmentBanner />
      {/*
        * "I want to work on..." — the walkthroughs.
        *
        * THIS MOUNT IS THE WHOLE FEATURE. Without it GuideProvider,
        * GuideChooser and GuidePanel are three files nothing ever renders.
        *
        * Which is exactly what happened. The components shipped on 15
        * September in ea503a21 — provider, chooser, panel, a fifty-walkthrough
        * catalog and 84 passing tests — and this line was left out of the git
        * add. Everything built, everything green, and for two days the feature
        * existed in production and rendered nothing at all. Jimmy found it by
        * opening the dashboard and looking for it.
        *
        * The same shape as the comment below about `permissions`: the piece had
        * its own tests and passed them, and nothing tested that it was ever
        * CONNECTED. The seam is always where it breaks.
        * guides-mounted.test.ts now asserts this file mounts all three.
        *
        * userId keys the per-person progress and the "stop opening this"
        * choice, so two people at one machine do not inherit each other's.
        */}
      <GuideProvider userId={auth.user.id}>
        <GuideChooser />
        <GuidePanel />
        {children}
      </GuideProvider>
    </DashboardShell>
  );
}
