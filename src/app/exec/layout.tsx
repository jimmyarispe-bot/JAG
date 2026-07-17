import { redirect } from "next/navigation";
import { ExecShell } from "@/components/exec/ExecShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser, getSessionUser } from "@/lib/auth/session";
import { requireJagAccess } from "@/lib/platform/identity/page-guard";
import { resolveExecutiveContextForIdentity } from "@/lib/platform/organization-platform";

export const metadata = {
  title: "Executive Command Center · JAG",
  description: "CEO-facing operating surface for organizational intelligence",
};

export default async function ExecLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, sessionUser] = await Promise.all([getAuthUser(), getSessionUser()]);

  if (!user || !sessionUser) {
    redirect("/login");
  }

  redirectIfPasswordResetRequired(user, "/exec");

  // Sprint 007 — Founder Protection (JAG_ACCESS via permission engine).
  const ctx = await requireJagAccess();

  const tenant = resolveExecutiveContextForIdentity(ctx);

  return (
    <ExecShell
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      organizationName={tenant?.organizationName}
      locationName={tenant?.locationName}
    >
      {children}
    </ExecShell>
  );
}
