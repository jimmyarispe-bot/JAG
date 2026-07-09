import Link from "next/link";
import type { FounderMorningBriefExecutive } from "@/lib/dashboard/morning-brief";
import type { JagWorkItem } from "@/lib/platform/jag-work";
import type { MissionControlPriorityItem } from "@/lib/platform/automation/mission-control-compose";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-900",
  high: "border-orange-200 bg-orange-50 text-orange-900",
  medium: "border-slate-200 bg-slate-50 text-slate-800",
  low: "border-blue-100 bg-blue-50 text-blue-900",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50",
  high: "border-amber-200 bg-amber-50",
  medium: "border-slate-200 bg-white",
  low: "border-slate-200 bg-white",
};

interface FounderMorningBriefSectionsProps {
  executive: FounderMorningBriefExecutive;
  missionControlLabel: string;
  intelligenceEngineLabel: string;
}

export function FounderMorningBriefSections({
  executive,
  missionControlLabel,
  intelligenceEngineLabel,
}: FounderMorningBriefSectionsProps) {
  const { priorities, aiBrief, decisionsWaiting, decisionsCount, executiveSummary } =
    executive;

  return (
    <div className="space-y-6">
      <PrioritiesSection
        priorities={priorities}
        missionControlLabel={missionControlLabel}
      />
      <AiBriefSection
        aiBrief={aiBrief}
        intelligenceEngineLabel={intelligenceEngineLabel}
        executiveSummary={executiveSummary}
      />
      <DecisionsWaitingSection
        items={decisionsWaiting}
        count={decisionsCount}
        intelligenceEngineLabel={intelligenceEngineLabel}
      />
    </div>
  );
}

function PrioritiesSection({
  priorities,
  missionControlLabel,
}: {
  priorities: MissionControlPriorityItem[];
  missionControlLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Priorities</h2>
          <p className="mt-1 text-sm text-slate-500">Items that need attention today</p>
        </div>
        <Link
          href="/dashboard/mission-control"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Open {missionControlLabel} →
        </Link>
      </div>
      {priorities.length ? (
        <ul className="mt-4 space-y-2">
          {priorities.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border px-4 py-3 text-sm ${SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.medium}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 text-xs opacity-80">{item.description}</p>
                  )}
                </div>
                {item.href && (
                  <Link href={item.href} className="shrink-0 text-xs font-medium underline">
                    Open
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No critical priorities right now.</p>
      )}
    </section>
  );
}

function AiBriefSection({
  aiBrief,
  intelligenceEngineLabel,
  executiveSummary,
}: {
  aiBrief: FounderMorningBriefExecutive["aiBrief"];
  intelligenceEngineLabel: string;
  executiveSummary?: string;
}) {
  const summary =
    executiveSummary?.trim() ||
    aiBrief.executiveBrief ||
    (aiBrief.highestRisks[0]
      ? `${aiBrief.highestRisks[0].title} — ${aiBrief.highestRisks[0].body}`
      : null);

  const actions = aiBrief.recommendedActions.slice(0, 3);

  return (
    <section className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Brief</h2>
          <p className="mt-1 text-sm text-slate-500">Executive summary from your intelligence engines</p>
        </div>
        <Link
          href="/dashboard/executive/briefings"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          All briefings →
        </Link>
      </div>
      {summary ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{summary}</p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No brief generated yet. Queue processing will populate insights automatically.
        </p>
      )}
      {actions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {actions.map((action) => (
            <li key={action.id} className="rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-sm">
              <p className="font-medium text-slate-900">{action.title}</p>
              <p className="mt-0.5 text-slate-600">→ {action.action}</p>
              {action.href && (
                <Link
                  href={action.href}
                  className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline"
                >
                  Review in {intelligenceEngineLabel}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DecisionsWaitingSection({
  items,
  count,
  intelligenceEngineLabel,
}: {
  items: JagWorkItem[];
  count: number;
  intelligenceEngineLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Decisions Waiting</h2>
          <p className="mt-1 text-sm text-slate-500">
            {count > 0
              ? `${count} item${count === 1 ? "" : "s"} need your judgment`
              : "Nothing requiring your decision right now"}
          </p>
        </div>
        <Link
          href="/dashboard/executive?work=needs_human_decision"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Open {intelligenceEngineLabel} →
        </Link>
      </div>
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border px-4 py-3 text-sm ${PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.medium}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  {item.recommendedNextAction && (
                    <p className="mt-1 text-xs text-slate-600">→ {item.recommendedNextAction}</p>
                  )}
                </div>
                {item.href && (
                  <Link href={item.href} className="shrink-0 text-xs font-medium text-brand-600 hover:underline">
                    Review
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
