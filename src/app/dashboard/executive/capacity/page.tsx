import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canViewEdi } from "@/lib/edi/access";
import { ExecutiveAccessEmpty } from "@/components/executive/ExecutiveAccessEmpty";
import { getLatestCapacitySnapshot } from "@/lib/edi/capacity-planning";
import { ListSkeleton } from "@/components/experience-system";

const CapacityPanel = dynamic(
  () =>
    import("@/components/edi/panels/CapacityPanel").then((m) => ({
      default: m.CapacityPanel,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={4} label="Loading capacityâ€¦" /> }
);

export default async function ExecutiveCapacityPage() {
  const ctx = await getIdentityContext();
  if (!ctx || !canViewEdi(ctx)) return <ExecutiveAccessEmpty reason="access" />;

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    "";

  if (!schoolId) return <ExecutiveAccessEmpty reason="school" />;

  const supabase = await createAuthClient();
  const capacity = await getLatestCapacitySnapshot(supabase, schoolId);

  const shortages = capacity.projectedShortages;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Capacity planning â€” seats, teacher utilization, rooms, schedule, campus, and projected shortages.
      </p>
      <CapacityPanel capacity={capacity} />
      {shortages && Object.keys(shortages).length > 0 && (
        <article className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm">
          <h3 className="font-semibold text-amber-900">Projected shortages</h3>
          <ul className="mt-2 space-y-1 text-amber-800">
            {Object.entries(shortages).map(([k, v]) => (
              <li key={k}>{k.replace(/_/g, " ")}: {String(v ?? "â€”")}</li>
            ))}
          </ul>
        </article>
      )}
    </div>
  );
}
