import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getReportTemplates } from "@/lib/executive/insights";
import { getSchools } from "@/lib/hr/queries";
import { ListSkeleton } from "@/components/experience-system";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";
import { getExecutiveReportsCatalog } from "@/lib/executive/experience/summaries";
import Link from "next/link";

const ReportingStudioPanel = dynamic(
  () =>
    import("@/components/executive/panels/ReportingStudioPanel").then((m) => ({
      default: m.ReportingStudioPanel,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={6} label="Loading reports…" /> }
);

export default async function ExecutiveReportsPage() {
  const ctx = await getIdentityContext();
  const schoolId =
    ctx?.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx?.accessibleSchoolIds[0];

  const supabase = await createAuthClient();
  const [templates, schools] = await Promise.all([
    getReportTemplates(supabase, schoolId),
    getSchools(),
  ]);

  const organizationId = schoolId ?? "default";
  if (ctx) {
    publishExecutiveExperienceEvent({
      type: "executive.report_exported",
      organizationId,
      recordType: "organization",
      recordId: organizationId,
      actorUserId: ctx.effectiveUserId,
      payload: { view: "reports_studio" },
      projectLive: false,
    });
  }

  const catalog = getExecutiveReportsCatalog();

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((r) => (
          <Link
            key={r.id}
            href={r.href}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm hover:border-brand-300"
          >
            <p className="font-semibold text-slate-900">{r.title}</p>
            <p className="mt-1 text-slate-600">{r.description}</p>
          </Link>
        ))}
      </section>
      <ReportingStudioPanel templates={templates} schools={schools} />
    </div>
  );
}
