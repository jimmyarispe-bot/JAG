import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnnouncementsPanel } from "@/components/communications/AnnouncementsPanel";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  canAnnounceSchoolWide,
  canComposeCommunications,
  canViewCommunications,
  listAnnouncements,
} from "@/lib/communications";

export default async function AnnouncementsPage() {
  const identity = await getIdentityContext();
  if (!canViewCommunications(identity)) {
    redirect("/dashboard");
  }

  const supabase = await createAuthClient();
  const announcements = await listAnnouncements(supabase, { limit: 50 });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader
        title="Announcements"
        subtitle="School-wide and audience-targeted announcements"
        actions={
          <Link
            href="/dashboard/communications"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
        }
      />
      <AnnouncementsPanel
        announcements={announcements as Array<{
          id: string;
          title: string;
          body_text: string;
          target_audience: string;
          status: string;
          scheduled_for: string | null;
          published_at: string | null;
          created_at: string;
        }>}
        canPublishSchoolWide={canAnnounceSchoolWide(identity)}
        canCompose={canComposeCommunications(identity)}
      />
    </div>
  );
}
