import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeopleDirectoryTable } from "@/components/people/PeopleDirectoryTable";
import { getDirectory, getSchoolOptions } from "@/lib/people/directory";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canImportStudents } from "@/lib/platform/imports/access";
import { canManageStudentLifecycle } from "@/lib/students/lifecycle";

export const metadata = {
  title: "People",
  description: "Every student and prospective family across the network",
};

export const dynamic = "force-dynamic";

export default async function PeopleDirectoryPage() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");
  // Same bar as the roster and the import wizard: anyone who may see student
  // records may see this, since it is those records plus the pipeline.
  if (!canImportStudents(identity)) redirect("/dashboard");

  const [people, schools] = await Promise.all([getDirectory(), getSchoolOptions()]);

  // Full width, deliberately. The dashboard's <main> already pads the content
  // area, so the p-6 here was doubling it, and max-w-7xl left a band of empty
  // page beside an eight-column table that was scrolling sideways to fit.
  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        subtitle="Every student and prospective family — enrolled, in the pipeline, alumni, and those who did not enrol"
      />
      <PeopleDirectoryTable
        people={people}
        schools={schools}
        canManageLifecycle={canManageStudentLifecycle(identity)}
      />
    </div>
  );
}
