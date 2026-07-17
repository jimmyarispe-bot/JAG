import { createAuthClient } from "@/lib/supabase/server-auth";
import { requireFinanceAccess } from "@/lib/platform/identity/page-guard";
import { getForecastingCenter } from "@/lib/executive/forecasting";
import { getSchools } from "@/lib/hr/queries";
import { ForecastingPanel } from "@/components/executive/ExecutivePanels";

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
