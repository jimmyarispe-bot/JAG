import { redirect } from "next/navigation";
import { ExecShell } from "@/components/exec/ExecShell";
import { redirectIfPasswordResetRequired } from "@/lib/auth/must-reset-password";
import { getAuthUser } from "@/lib/auth/auth-user";
import { getExecRuntime } from "@/lib/exec/scope";
import { requireJagAccess } from "@/lib/platform/identity/page-guard";

export const metadata = {
  title: "Executive Command Center · JAG",
  description: "CEO-facing operating surface for organizational intelligence",
};

/**
 * Sprint P002 — authenticate via shared getAuthUser; authorize once via requireJagAccess.
 * Avoids parallel getSessionUser + identity double-load.
 */
export default async function ExecLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  redirectIfPasswordResetRequired(user, "/exec");

  // P006: Jag access gate and exec runtime both need identity (cached) — overlap I/O.
  // requireJagAccess still redirects on failure (throws); runtime is unused in that case.
  const [ctx, runtime] = await Promise.all([requireJagAccess(), getExecRuntime()]);

  return (
    <ExecShell
      fullName={ctx.fullName}
      roleLabel={ctx.roleLabel}
      organizationName={runtime.organizationName}
      locationName={runtime.locationName}
      operatingMode={runtime.mode}
      provenanceLabel={runtime.provenanceLabel}
      provenanceDetail={runtime.provenanceDetail}
    >
      {children}
    </ExecShell>
  );
}
