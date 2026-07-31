import { redirect } from "next/navigation";
import { FounderShell } from "@/components/founder/FounderShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser } from "@/lib/auth/auth-user";
import { requireJagAccess } from "@/lib/platform/identity/page-guard";
import { OrganizationService } from "@/lib/platform/organizations";

export const metadata = {
  title: "Founder Workspace · The JAG™",
  description: "The JAG™ Founder Command Center",
};

/**
 * Sprint 065 — Founder Workspace route protection (JAG_ACCESS).
 * Unauthorized users never see this layout (redirect to AcademyOS home).
 */
export default async function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  redirectIfPasswordResetRequired(user, "/founder");

  const ctx = await requireJagAccess();
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
