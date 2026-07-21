import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getGrantsDashboard } from "@/lib/executive/insights";
import { getSchools } from "@/lib/hr/queries";
import { ListSkeleton } from "@/components/experience-system";

const GrantsDashboardPanel = dynamic(
  () =>
    import("@/components/executive/panels/GrantsDashboardPanel").then((m) => ({
      default: m.GrantsDashboardPanel,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={6} label="Loading grants…" /> }
);

export default async function ExecutiveGrantsPage() {
  const ctx = await getIdentityContext();
  const schoolId =
    ctx?.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx?.accessibleSchoolIds[0];

  const supabase = await createAuthClient();
  const [data, schools] = await Promise.all([
    getGrantsDashboard(supabase, schoolId),
    getSchools(),
  ]);

  return <GrantsDashboardPanel data={data} schools={schools} />;
}
