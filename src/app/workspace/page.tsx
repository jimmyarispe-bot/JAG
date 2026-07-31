import { redirect } from "next/navigation";
import { resolveAcademyWorkspaceLanding } from "@/applications/academyos/workspace";
import { ensureJAGBooted } from "@/jag/runtime";
import { getIdentityContext } from "@/lib/platform/identity/context";
import "@/packages/academy/host";

/**
 * Central workspace entry — role → landing route.
 * Login / MFA / activate default `next` here so landing stays application-owned.
 */
export default async function WorkspaceEntryPage() {
  ensureJAGBooted();

  const ctx = await getIdentityContext();
  if (!ctx) {
    redirect("/login?next=/workspace");
  }

  redirect(
    resolveAcademyWorkspaceLanding({
      roles: ctx.roles,
      primaryRole: ctx.primaryRole,
      permissions: ctx.permissions,
    })
  );
}
