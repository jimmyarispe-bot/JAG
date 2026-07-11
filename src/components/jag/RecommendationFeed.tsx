import type { ExecutiveWorkspaceLinks } from "@/lib/platform/jag/workspace";
import type { OrganizationRecommendation } from "@/lib/platform/intelligence/organization/types";
import type { StrategicRecommendation } from "@/lib/platform/intelligence/domains/strategic/types";
import type { DecisionRecommendation } from "@/lib/platform/intelligence/decision/types";
import type { JagModeratedRecommendation } from "@/lib/platform/jag/collaboration/types";

export interface WorkspaceRecommendationItem {
  id: string;
  source: "organization" | "strategic" | "decision" | "collaboration";
  title: string;
  summary: string;
  priority: string;
}

interface RecommendationFeedProps {
  organization: readonly OrganizationRecommendation[];
  strategic: readonly StrategicRecommendation[];
  decision: DecisionRecommendation | null;
  collaboration: readonly JagModeratedRecommendation[];
  links: ExecutiveWorkspaceLinks;
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
    >
      {label}
    </a>
  );
}

function RecommendationLinks({ links }: { links: ExecutiveWorkspaceLinks }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {links.evidenceIds[0] && (
        <LinkChip href={`#evidence-${links.evidenceIds[0]}`} label="Evidence" />
      )}
      {links.memoryIds[0] && (
        <LinkChip href={`#memory-${links.memoryIds[0]}`} label="Memory" />
      )}
      {links.goalIds[0] && <LinkChip href={`#execution-${links.goalIds[0]}`} label="Goals" />}
      {links.executionIds[0] && (
        <LinkChip href={`#execution-${links.executionIds[0]}`} label="Execution" />
      )}
      {links.decisionId && (
        <LinkChip href={`#decision-${links.decisionId}`} label="Decision history" />
      )}
      {links.organizationRequestId && (
        <LinkChip href="#organization-map" label="Organization context" />
      )}
    </div>
  );
}

export function RecommendationFeed({
  organization,
  strategic,
  decision,
  collaboration,
  links,
}: RecommendationFeedProps) {
  const items: WorkspaceRecommendationItem[] = [
    ...organization.map((r) => ({
      id: r.recommendationId,
      source: "organization" as const,
      title: r.title,
      summary: r.rationale,
      priority: r.priority,
    })),
    ...strategic.map((r) => ({
      id: r.recommendationId,
      source: "strategic" as const,
      title: r.expectedImpact,
      summary: r.recommendedActions.join(" · "),
      priority: r.urgency,
    })),
    ...(decision
      ? [
          {
            id: decision.recommendationId,
            source: "decision" as const,
            title: decision.recommendedOption,
            summary: decision.rationale.join(" · "),
            priority: decision.priority,
          },
        ]
      : []),
    ...collaboration.map((r) => ({
      id: r.recommendationKey,
      source: "collaboration" as const,
      title: r.title,
      summary: r.summary,
      priority: `urgency ${r.urgency}`,
    })),
  ];

  return (
    <section id="recommendations" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Recommendations</h2>
      <p className="mt-1 text-sm text-slate-500">
        Every recommendation links to evidence, memory, goals, execution, decisions, and org context.
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No recommendations in this cycle.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.slice(0, 12).map((item) => (
            <li key={`${item.source}-${item.id}`} className="rounded-xl border border-slate-100 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  {item.source} · {item.priority}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
              <RecommendationLinks links={links} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
