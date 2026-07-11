import { PageHeader } from "@/components/ui/PageHeader";
import { ActiveAlerts } from "@/components/jag/ActiveAlerts";
import { AgentActivity } from "@/components/jag/AgentActivity";
import { ConversationWorkspace } from "@/components/jag/ConversationWorkspace";
import { DecisionCenter } from "@/components/jag/DecisionCenter";
import { EvidenceExplorer } from "@/components/jag/EvidenceExplorer";
import { ExecutiveBrief } from "@/components/jag/ExecutiveBrief";
import { ExecutiveScorecard } from "@/components/jag/ExecutiveScorecard";
import { ForecastPanel } from "@/components/jag/ForecastPanel";
import { GoalExecution } from "@/components/jag/GoalExecution";
import { IntelligenceTimeline } from "@/components/jag/IntelligenceTimeline";
import { MemoryExplorer } from "@/components/jag/MemoryExplorer";
import { OrganizationHealth } from "@/components/jag/OrganizationHealth";
import { OrganizationMap } from "@/components/jag/OrganizationMap";
import { QuickActions } from "@/components/jag/QuickActions";
import { RecommendationFeed } from "@/components/jag/RecommendationFeed";
import type { ExecutiveWorkspaceData } from "@/lib/platform/jag/workspace";

interface ExecutiveWorkspaceProps {
  data: ExecutiveWorkspaceData;
}

export function ExecutiveWorkspace({ data }: ExecutiveWorkspaceProps) {
  if (data.accessError) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">JAG Executive Workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          {data.accessError === "Forbidden"
            ? "You need executive.dashboard or executive.intelligence permission to open this workspace."
            : "Sign in to load the Executive Workspace."}
        </p>
      </div>
    );
  }

  const org = data.organization;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="JAG Executive Workspace"
        subtitle={`${data.roleLabel} · continuous organizational intelligence`}
        backHref="/dashboard"
      />

      {/* Primary JAG interface */}
      <ConversationWorkspace
        brief={org?.brief ?? null}
        recommendations={data.collaboration?.moderated.mergedRecommendations ?? []}
        links={data.links}
        consensusSummary={data.collaboration?.consensus.summary ?? null}
      />

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-2">
        <ExecutiveBrief
          brief={org?.brief ?? null}
          generatedAt={data.generatedAt}
          fullName={data.fullName}
        />
        <OrganizationHealth health={org?.health ?? null} kpis={data.kpis} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActiveAlerts alerts={org?.alerts ?? []} />
        <DecisionCenter decision={data.decision} />
      </div>

      <GoalExecution
        strategicGoals={data.strategic?.goals ?? []}
        executionGoals={data.executionGoals}
        progress={data.executionProgress}
      />

      <ForecastPanel forecasts={org?.forecasts ?? []} />

      <RecommendationFeed
        organization={org?.recommendations ?? []}
        strategic={data.strategic?.recommendations ?? []}
        decision={data.decision?.recommendation ?? null}
        collaboration={data.collaboration?.moderated.mergedRecommendations ?? []}
        links={data.links}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <IntelligenceTimeline timeline={org?.timeline ?? []} />
        <AgentActivity collaboration={data.collaboration} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MemoryExplorer memories={data.memories} />
        <EvidenceExplorer
          evidence={data.decision?.evidence.items ?? []}
          summary={data.decision?.evidence.summary}
        />
      </div>

      <OrganizationMap
        readings={org?.readings ?? []}
        organizationId={data.organizationId}
        schoolId={data.schoolId}
        requestId={org?.requestId ?? null}
      />

      <ExecutiveScorecard
        scorecards={data.scorecards}
        health={org?.health ?? null}
        kpis={data.kpis}
      />
    </div>
  );
}
