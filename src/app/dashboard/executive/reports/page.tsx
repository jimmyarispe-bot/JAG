import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getReportTemplates } from "@/lib/executive/insights";
import { getSchools } from "@/lib/hr/queries";
import { ListSkeleton } from "@/components/experience-system";

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

  return <ReportingStudioPanel templates={templates} schools={schools} />;
}
