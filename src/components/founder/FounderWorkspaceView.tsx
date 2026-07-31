import { ActivePrioritiesPanel } from "@/components/founder/ActivePrioritiesPanel";
import { ApplicationHealthPanel } from "@/components/founder/ApplicationHealthPanel";
import { AutomationStatusPanel } from "@/components/founder/AutomationStatusPanel";
import { CriticalAlertsPanel } from "@/components/founder/CriticalAlertsPanel";
import { ExecutiveMetricsPanel } from "@/components/founder/ExecutiveMetricsPanel";
import { ForecastsPanel } from "@/components/founder/ForecastsPanel";
import { MorningBriefPanel } from "@/components/founder/MorningBriefPanel";
import { DecisionQueuePanel } from "@/components/founder/DecisionQueuePanel";
import { OrganizationExplorer } from "@/components/founder/OrganizationExplorer";
import { OrganizationHealthPanel } from "@/components/founder/OrganizationHealthPanel";
import {
  SystemStatusPanel,
  type SystemStatusItem,
} from "@/components/founder/SystemStatusPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import type { FounderWorkspaceContext } from "@/lib/platform/founder/types";

type FounderWorkspaceViewProps = {
  workspace: FounderWorkspaceContext;
  systemStatus: SystemStatusItem[];
};

/** Thin composition — data from FounderWorkspaceService / EI / DecisionService. */
export function FounderWorkspaceView({
  workspace,
  systemStatus,
}: FounderWorkspaceViewProps) {
  const intelligence = workspace.intelligence;
  const organizationNames = Object.fromEntries(
    workspace.organizations.map((o) => [o.id, o.name])
  );
  const applicationNames = Object.fromEntries(
    workspace.applications.map((a) => [a.key, a.name])
  );

  const scopeLabel =
    workspace.activeOrganization?.name ??
    workspace.activeApplication?.name ??
    "The JAG™";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Founder Workspace"
        subtitle={`${scopeLabel} · The JAG™ Command Center`}
      />

      <MorningBriefPanel
        sections={workspace.briefing.sections}
        generatedAt={workspace.briefing.generatedAt}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CriticalAlertsPanel
          alerts={workspace.alerts}
          organizationNames={organizationNames}
          applicationNames={applicationNames}
        />
        <ActivePrioritiesPanel priorities={intelligence?.priorities ?? []} />
      </div>

      <ExecutiveMetricsPanel metrics={workspace.metrics} />

      <ForecastsPanel forecasts={workspace.forecasts} />

      <div className="grid gap-6 lg:grid-cols-2">
        <OrganizationHealthPanel
          organizations={workspace.organizations}
          activeOrganizationId={workspace.activeOrganization?.id}
        />
        <ApplicationHealthPanel
          applications={workspace.applications}
          activeApplicationKey={workspace.activeApplication?.key}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrganizationExplorer navigation={workspace.navigation} />
        <DecisionQueuePanel
          queue={workspace.decisionQueue}
          organizationNames={organizationNames}
          accountability={workspace.decisionAccountability}
          now={workspace.generatedAt}
        />
      </div>

      <AutomationStatusPanel status={workspace.automationStatus} />

      <SystemStatusPanel items={systemStatus} />
    </div>
  );
}
