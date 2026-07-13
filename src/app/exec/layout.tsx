import { redirect } from "next/navigation";
import { ExecShell } from "@/components/exec/ExecShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser, getSessionUser } from "@/lib/auth/session";
import { canAccessExecutiveIntelligence } from "@/lib/executive/access";
import { getIdentityContext } from "@/lib/platform/identity/context";

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

  const ctx = await getIdentityContext();
  if (!ctx) {
    redirect("/login");
  }

  if (!canAccessExecutiveIntelligence(ctx)) {
    redirect("/dashboard");
  }

  return (
    <ExecShell fullName={ctx.fullName} roleLabel={ctx.roleLabel}>
      {children}
    </ExecShell>
  );
}
