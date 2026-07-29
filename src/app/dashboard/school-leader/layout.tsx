import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { SchoolLeaderWorkspaceNav } from "@/components/school-leader/experience/SchoolLeaderWorkspaceNav";

/**
 * Wave 1.5 — School Leader Workspace (product experience layer).
 */
export default async function SchoolLeaderLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission([
    "students.view",
    "school.configure",
    "admissions.view",
    "executive.dashboard",
    "scheduling.executive",
    "compliance.view",
    "hr.view",
    "finance.view",
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      <SchoolLeaderWorkspaceNav />
      {children}
    </div>
  );
}
