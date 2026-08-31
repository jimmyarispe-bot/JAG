import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SchoolAdmissionsContactPanel } from "@/components/admissions/SchoolAdmissionsContactPanel";
import { getSchoolAdmissionsContacts } from "@/lib/admissions/school-contacts";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canManageStudentLifecycle } from "@/lib/students/lifecycle";

export const metadata = {
  title: "Admissions contacts",
  description: "Who handles inquiries at each school, and where families book time",
};

export const dynamic = "force-dynamic";

export default async function AdmissionsContactsPage() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");

  /**
   * Say no out loud.
   *
   * This guard used to `redirect("/dashboard")`, which is indistinguishable
   * from a broken link: you click a card that exists, you land somewhere else,
   * and nothing tells you whether the page is missing, the deploy is behind, or
   * your role is short. It cost an hour of exactly that. A refusal that names
   * the check and the roles it found is the whole difference.
   */
  if (!canManageStudentLifecycle(identity)) {
    const roles = identity.roles?.length ? identity.roles.join(", ") : "none";
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Admissions contacts"
          subtitle="You do not have access to this page"
          backHref="/dashboard/admin"
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">This page needs one of: CEO, FOUNDER, SCHOOL_LEADER.</p>
          <p className="mt-1">
            The roles on your account are: <span className="font-mono">{roles}</span>
          </p>
          <p className="mt-2 text-amber-800">
            If that looks wrong, the roles are set under Platform Administration &rarr; Users.
          </p>
        </div>
      </div>
    );
  }

  const schools = await getSchoolAdmissionsContacts();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Admissions contacts"
        subtitle="Who a prospective family hears from at each school, and where they book a time"
        backHref="/dashboard/admin"
      />

      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        When an inquiry arrives through the public form, the family is emailed the booking
        link for the school they chose, signed by the contact named here, and that contact is
        emailed the inquiry. A school with no booking link still sends a confirmation — it
        promises a person will be in touch instead of offering a link that does not exist.
      </p>

      <SchoolAdmissionsContactPanel schools={schools} />
    </div>
  );
}
