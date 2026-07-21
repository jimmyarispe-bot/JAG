import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudentImportWizard } from "@/components/students/StudentImportWizard";
import { canImportStudents } from "@/lib/platform/imports/access";
import { getStudentImportPageData } from "@/lib/platform/imports/actions";
import { getIdentityContext } from "@/lib/platform/identity/context";

export default async function StudentImportPage() {
  const identity = await getIdentityContext();
  if (!canImportStudents(identity)) {
    redirect("/dashboard/students");
  }

  const data = await getStudentImportPageData();
  if (!data.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <PageHeader title="Student Import" backHref="/dashboard/students" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {data.error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Bulk Student Import"
        subtitle="Platform import engine — upload, map, validate, preview, and commit"
        backHref="/dashboard/students"
        actions={
          <Link
            href="/dashboard/students?view=add"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Add single student
          </Link>
        }
      />
      <StudentImportWizard
        schools={data.schools}
        campuses={data.campuses}
        schoolYears={data.schoolYears}
        programs={data.programs}
        history={data.history}
        templates={data.templates}
      />
    </div>
  );
}
