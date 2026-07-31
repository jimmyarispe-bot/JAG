import { redirect } from "next/navigation";
import { FounderShell } from "@/components/founder/FounderShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser } from "@/lib/auth/auth-user";
import {
  hasPermission,
  toAuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { ACADEMYOS_HOME_PATH } from "@/lib/platform/identity/founder-protection";
import { OrganizationService } from "@/lib/platform/organizations";

export const metadata = {
  title: "My Decisions · The JAG™",
  description: "Assigned decisions for Executive Directors and Founders",
};

function canAccessDecisions(
  ctx: NonNullable<Awaited<ReturnType<typeof getIdentityContext>>>
): boolean {
  const snapshot = toAuthzSnapshot(ctx);
  if (hasPermission(snapshot, "JAG_ACCESS")) return true;
  const roles = ctx.roles ?? [];
  return (
    roles.includes("EXECUTIVE_DIRECTOR") ||
    ctx.primaryRole === "EXECUTIVE_DIRECTOR"
  );
}

/**
 * Sprint 067 — Decision assignee surface.
 * Founder (JAG_ACCESS) or Executive Director may enter.
 */
export default async function DecisionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAuthUser();
  if (!user) redirect("/login");

  redirectIfPasswordResetRequired(user, "/decisions");

  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");
  if (!canAccessDecisions(ctx)) redirect(ACADEMYOS_HOME_PATH);

  const org = await OrganizationService.resolve({ userId: ctx.effectiveUserId });

  return (
    <FounderShell
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      organizationName={
        org.organization.id !== "platform" ? org.organization.name : null
      }
    >
      {children}
    </FounderShell>
  );
}
