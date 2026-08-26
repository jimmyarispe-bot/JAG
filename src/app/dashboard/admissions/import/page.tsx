import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StudentImportWizard } from "@/components/students/StudentImportWizard";
import { canImportStudents } from "@/lib/platform/imports/access";
import { getStudentImportPageData } from "@/lib/platform/imports/actions";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getEnvironmentIdentity } from "@/lib/platform/environment/identity";

export const metadata = {
  title: "Admissions Pipeline Import",
  description: "Bulk import admissions leads into the pipeline",
};

export default async function AdmissionsLeadImportPage() {
  const identity = await getIdentityContext();
  if (!canImportStudents(identity)) {
    redirect("/dashboard/admissions");
  }

  const [data, environment] = await Promise.all([
    getStudentImportPageData("admissions_lead"),
    getEnvironmentIdentity(),
  ]);
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
      {/*
        Say where the rows will land, on the page where it matters most. On
        25 Aug 2026 a full lead import ran against the wrong database because
        nothing on screen distinguished one from the other.
      */}
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          environment.databaseIsProduction
            ? "border-slate-300 bg-slate-50 text-slate-700"
            : "border-amber-300 bg-amber-50 text-amber-900"
        }`}
      >
        <span className="font-semibold">Writing to: </span>
        {environment.databaseName ?? "unidentified database"}
        {environment.databaseRef ? (
          <span className="ml-1.5 font-mono text-xs opacity-75">{environment.databaseRef}</span>
        ) : null}
        {!environment.databaseIsProduction ? (
          <span className="ml-2">
            — not the live database. Records imported here will not appear on thejag.org.
          </span>
        ) : null}
      </div>
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
