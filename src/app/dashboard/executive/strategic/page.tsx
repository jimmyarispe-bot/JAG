import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { getStrategicPlanningWorkspace } from "@/lib/executive/insights";
import { getSchools } from "@/lib/hr/queries";
import { ListSkeleton } from "@/components/experience-system";

const StrategicPlanningPanel = dynamic(
  () =>
    import("@/components/executive/panels/StrategicPlanningPanel").then((m) => ({
      default: m.StrategicPlanningPanel,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={6} label="Loading strategic planning…" /> }
);

export default async function ExecutiveStrategicPage() {
  const ctx = await getIdentityContext();
  const schoolId =
    ctx?.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx?.accessibleSchoolIds[0];

  const supabase = await createAuthClient();
  const [goals, schools] = await Promise.all([
    getStrategicPlanningWorkspace(supabase, schoolId),
    getSchools(),
  ]);

  return <StrategicPlanningPanel goals={goals} schools={schools} />;
}
