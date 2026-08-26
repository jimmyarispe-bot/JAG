import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PeopleDirectoryTable } from "@/components/people/PeopleDirectoryTable";
import { getDirectory } from "@/lib/people/directory";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canImportStudents } from "@/lib/platform/imports/access";

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

  const people = await getDirectory();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="People"
        subtitle="Every student and prospective family — enrolled, in the pipeline, alumni, and those who did not enrol"
      />
      <PeopleDirectoryTable people={people} />
    </div>
  );
}
