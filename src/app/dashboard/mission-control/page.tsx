import { PageHeader } from "@/components/ui/PageHeader";
import { MissionControlView } from "@/components/platform/MissionControlView";
import { getMissionControlDashboard } from "@/lib/platform/automation/queries";

/**
 * Mission Control — Sprint 002 Task 6.
 * Compose path uses Executive Aggregate Metrics + Alert Orchestrator
 * (see mission-control-compose.ts). Queue processing stays on cron —
 * not on page load (removed processAllPlatformQueues).
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
      <MissionControlView {...data} />
    </div>
  );
}
