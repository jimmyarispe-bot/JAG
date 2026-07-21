import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireFinanceAccess } from "@/lib/platform/identity/page-guard";
import { getForecastingCenter } from "@/lib/executive/forecasting";
import { getSchools } from "@/lib/hr/queries";
import { ListSkeleton } from "@/components/experience-system";

const ForecastingPanel = dynamic(
  () =>
    import("@/components/executive/panels/ForecastingPanel").then((m) => ({
      default: m.ForecastingPanel,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={6} label="Loading forecasting…" /> }
);

export default async function ExecutiveForecastingPage() {
  // Sprint 008 — Financial Security (FINANCE_ACCESS via permission engine).
  const ctx = await requireFinanceAccess();
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    "";

  const supabase = await createAuthClient();
  const [forecast, schools] = await Promise.all([
    schoolId ? getForecastingCenter(supabase, schoolId) : Promise.resolve({ baseline: null, scenarios: [] }),
    getSchools(),
  ]);

  return (
    <ForecastingPanel
      baseline={forecast.baseline as Record<string, unknown> | null}
      scenarios={forecast.scenarios}
      schoolId={schoolId}
      schools={schools}
    />
  );
}
