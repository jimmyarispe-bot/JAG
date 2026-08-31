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
  // Same bar as the write action behind it. A page that loads and then refuses
  // every save teaches nobody why.
  if (!canManageStudentLifecycle(identity)) redirect("/dashboard");

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
