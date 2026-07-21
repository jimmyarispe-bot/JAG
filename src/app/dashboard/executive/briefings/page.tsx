import dynamic from "next/dynamic";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canViewEdi, canAccessEdiBoard } from "@/lib/edi/access";
import { ExecutiveAccessEmpty } from "@/components/executive/ExecutiveAccessEmpty";
import { getLatestBriefings } from "@/lib/edi/briefings";
import { getLatestScorecard } from "@/lib/edi/scorecard";
import { ListSkeleton } from "@/components/experience-system";
import { ActionChip } from "@/components/experience-system/feedback/ActionChip";

const BriefingList = dynamic(
  () =>
    import("@/components/edi/panels/BriefingList").then((m) => ({
      default: m.BriefingList,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={4} label="Loading briefingsâ€¦" /> }
);
const ExecutiveScorecardPanel = dynamic(
  () =>
    import("@/components/edi/panels/ExecutiveScorecardPanel").then((m) => ({
      default: m.ExecutiveScorecardPanel,
    })),
  { ssr: true, loading: () => <ListSkeleton rows={3} label="Loading scorecardâ€¦" /> }
);

export default async function ExecutiveBriefingsPage() {
  const ctx = await getIdentityContext();
  if (!ctx || !canViewEdi(ctx)) return <ExecutiveAccessEmpty reason="access" />;

  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    "";

  if (!schoolId) return <ExecutiveAccessEmpty reason="school" />;

  const supabase = await createAuthClient();
  const [briefings, scorecard] = await Promise.all([
    getLatestBriefings(supabase, schoolId),
    getLatestScorecard(supabase, schoolId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          Executive briefings â€” top risks, opportunities, ROI programs, and board summaries.
        </p>
        {canAccessEdiBoard(ctx) && (
          <ActionChip href={`/api/edi/board-report?school_id=${schoolId}`} size="sm" variant="secondary">
            Export board report
          </ActionChip>
        )}
      </div>
      <ExecutiveScorecardPanel scorecard={scorecard} />
      <BriefingList briefings={briefings} />
    </div>
  );
}
