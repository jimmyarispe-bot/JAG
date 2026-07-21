import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { TemplatesPanel } from "@/components/communications/TemplatesPanel";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  canComposeCommunications,
  canViewCommunications,
  listTemplates,
} from "@/lib/communications";

export default async function TemplatesPage() {
  const identity = await getIdentityContext();
  if (!canViewCommunications(identity)) {
    redirect("/dashboard");
  }

  const templates = await listTemplates({ includeGlobal: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Message templates"
        subtitle="Reusable templates with {{StudentName}}, {{GuardianName}}, {{School}}, {{Teacher}}, {{Program}}"
        actions={
          <Link
            href="/dashboard/communications"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
        }
      />
      <TemplatesPanel
        templates={templates}
        canCompose={canComposeCommunications(identity)}
      />
    </div>
  );
}
