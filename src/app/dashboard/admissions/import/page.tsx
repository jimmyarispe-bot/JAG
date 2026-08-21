import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudentImportWizard } from "@/components/students/StudentImportWizard";
import { canImportStudents } from "@/lib/platform/imports/access";
import { getStudentImportPageData } from "@/lib/platform/imports/actions";
import { getIdentityContext } from "@/lib/platform/identity/context";

export const metadata = {
  title: "Admissions Pipeline Import",
  description: "Bulk import admissions leads into the pipeline",
};

export default async function AdmissionsLeadImportPage() {
  const identity = await getIdentityContext();
  if (!canImportStudents(identity)) {
    redirect("/dashboard/admissions");
  }

  const data = await getStudentImportPageData("admissions_lead");
  if (!data.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <PageHeader title="Admissions Pipeline Import" backHref="/dashboard/admissions" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {data.error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Bulk Admissions Pipeline Import"
        subtitle="Upload prospective families with their pipeline stage — map, validate, preview, and commit"
        backHref="/dashboard/admissions"
        actions={
          <Link
            href="/dashboard/students/import"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Import enrolled students instead
          </Link>
        }
      />
      <StudentImportWizard
        entityType="admissions_lead"
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
