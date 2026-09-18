import dynamic from "next/dynamic";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/experience-system";
import { getMissionControlDashboard } from "@/lib/platform/automation/queries";
import { JobRunsPanel } from "@/components/platform/JobRunsPanel";

const MissionControlView = dynamic(
  () =>
    import("@/components/platform/MissionControlView").then((m) => ({
      default: m.MissionControlView,
    })),
  { loading: () => <ListSkeleton rows={6} label="Loading Mission Control…" /> }
);

/**
 * Mission Control — Sprint 002 Task 6 / P007 RSC view.
 * Compose path uses Executive Aggregate Metrics + Alert Orchestrator.
 * RC-6.05 — defer heavy client view until after shell paints.
 */
export default async function MissionControlPage() {
  const data = await getMissionControlDashboard();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Mission Control™"
        subtitle="The JAG™ operational command center — health, priorities, alerts, and real-time operations"
        backHref="/dashboard"
      />
      {/* Whether the nightly job ran. Recorded since migration 289 and read by
          nothing until now, which is why "did it run?" stayed unanswerable
          while the answer sat in the database. */}
      <JobRunsPanel />
      <MissionControlView {...data} />
    </div>
  );
}
