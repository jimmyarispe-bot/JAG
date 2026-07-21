import { PageHeader } from "@/components/ui/PageHeader";
import { TasksList } from "@/components/work/WorkLists";
import { CreateTaskForm } from "@/components/work/WorkMutationControls";
import { canManageWork, canViewWork } from "@/lib/work/access";
import { getTasks, getProjects } from "@/lib/work/queries";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const ctx = await getIdentityContext();
  if (!ctx || !canViewWork(ctx)) redirect("/dashboard");

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    undefined;

  const supabase = await createAuthClient();
  const [tasks, projects] = await Promise.all([
    getTasks(supabase, { schoolId, limit: 200 }),
    getProjects(supabase, { schoolId, status: "active", limit: 50 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Tasks" subtitle="All operational tasks across projects and playbooks" />

      {canManageWork(ctx) && <CreateTaskForm schoolId={schoolId} projects={projects} />}

      <TasksList tasks={tasks} />
    </div>
  );
}
