import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canViewEdi } from "@/lib/edi/access";
import { ExecutiveAccessEmpty } from "@/components/executive/ExecutiveAccessEmpty";
import { compareScenarios, runScenarioComparisonSet } from "@/lib/edi/scenario-comparison";
import { ListSkeleton } from "@/components/experience-system";

const ScenarioComparisonTable = dynamic(
  () =>
    import("@/components/edi/panels/ScenarioComparisonTable").then((m) => ({
      default: m.ScenarioComparisonTable,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={4} label="Loading scenariosâ€¦" /> }
);
const ScenarioForm = dynamic(
  () =>
    import("@/components/edi/panels/ScenarioForm").then((m) => ({
      default: m.ScenarioForm,
    })),
  { ssr: true }
);

export default async function ExecutiveScenariosPage() {
  const ctx = await getIdentityContext();
  if (!ctx || !canViewEdi(ctx)) return <ExecutiveAccessEmpty reason="access" />;

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    "";

  if (!schoolId) return <ExecutiveAccessEmpty reason="school" />;

  const supabase = await createAuthClient();
  let scenarios = await compareScenarios(supabase, schoolId);

  if (!scenarios.length) {
    await runScenarioComparisonSet(supabase, schoolId, ctx.effectiveUserId);
    scenarios = await compareScenarios(supabase, schoolId);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Compare tuition, staffing, enrollment, and capacity scenarios with projected financial and operational outcomes.
      </p>
      <ScenarioComparisonTable scenarios={scenarios} />
      <ScenarioForm schoolId={schoolId} />
    </div>
  );
}
