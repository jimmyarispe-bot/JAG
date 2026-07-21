import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectsList } from "@/components/work/WorkLists";
import { CreateProjectForm } from "@/components/work/WorkMutationControls";
import { canManageWork, canViewWork } from "@/lib/work/access";
import { getProjects } from "@/lib/work/queries";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { redirect } from "next/navigation";
import { getSchools } from "@/lib/hr/queries";

export default async function ProjectsPage() {
  const ctx = await getIdentityContext();
  if (!ctx || !canViewWork(ctx)) redirect("/dashboard");

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    undefined;

  const supabase = await createAuthClient();
  const [projects, schools] = await Promise.all([
    getProjects(supabase, { schoolId, limit: 100 }),
    getSchools(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Projects" subtitle="Enterprise projects across admissions, HR, finance, compliance, and operations" />

      {canManageWork(ctx) && <CreateProjectForm schools={schools} />}

      <ProjectsList projects={projects} />
    </div>
  );
}
