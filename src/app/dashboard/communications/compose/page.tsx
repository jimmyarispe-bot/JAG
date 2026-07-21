import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ComposeMessageForm } from "@/components/communications/ComposeMessageForm";
import { PhoneCallMeetingForms } from "@/components/communications/PhoneCallMeetingForms";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canComposeCommunications, listTemplates } from "@/lib/communications";

interface PageProps {
  searchParams: Promise<{
    studentId?: string;
    familyId?: string;
    schoolId?: string;
  }>;
}

export default async function ComposeCommunicationPage({ searchParams }: PageProps) {
  const identity = await getIdentityContext();
  if (!canComposeCommunications(identity)) {
    redirect("/dashboard/communications");
  }

  const sp = await searchParams;
  const templates = await listTemplates({ includeGlobal: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Compose message"
        subtitle="Send to students, guardians, families, classes, programs, or school"
        actions={
          <Link
            href="/dashboard/communications"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
        }
      />
      <ComposeMessageForm
        templates={templates}
        defaultSchoolId={sp.schoolId}
        defaultStudentId={sp.studentId}
        defaultFamilyId={sp.familyId}
      />
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Log call or meeting</h2>
        <PhoneCallMeetingForms
          schoolId={sp.schoolId}
          studentId={sp.studentId}
          familyId={sp.familyId}
        />
      </div>
    </div>
  );
}
